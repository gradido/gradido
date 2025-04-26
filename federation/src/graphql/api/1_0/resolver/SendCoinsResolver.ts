import { findUserByIdentifier } from '@/graphql/util/findUserByIdentifier'
import { fullName } from '@/graphql/util/fullName'
import { LogError } from '@/server/LogError'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { PendingTransactionLoggingView } from '@logging/PendingTransactionLogging.view'
import Decimal from 'decimal.js-light'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { PendingTransactionState } from '../enum/PendingTransactionState'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { SendCoinsArgsLoggingView } from '../logger/SendCoinsArgsLogging.view'
import { SendCoinsArgs } from '../model/SendCoinsArgs'
import { SendCoinsResult } from '../model/SendCoinsResult'
import { calculateRecipientBalance } from '../util/calculateRecipientBalance'
// import { checkTradingLevel } from '@/graphql/util/checkTradingLevel'
import { revertSettledReceiveTransaction } from '../util/revertSettledReceiveTransaction'
import { settlePendingReceiveTransaction } from '../util/settlePendingReceiveTransaction'
import { storeForeignUser } from '../util/storeForeignUser'

@Resolver()
export class SendCoinsResolver {
  @Mutation(() => SendCoinsResult)
  async voteForSendCoins(
    @Arg('data')
    args: SendCoinsArgs,
  ): Promise<SendCoinsResult> {
    logger.debug(`voteForSendCoins() via apiVersion=1_0 ...`, new SendCoinsArgsLoggingView(args))
    const result = new SendCoinsResult()
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: args.recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `voteForSendCoins with wrong recipientCommunityUuid`,
        args.recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(
        args.recipientUserIdentifier,
        args.recipientCommunityUuid,
      )
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `voteForSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    const openSenderPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: args.senderUserUuid, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: args.senderUserUuid, state: PendingTransactionState.NEW },
      ],
    })
    const openReceiverPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: receiverUser.gradidoID, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: receiverUser.gradidoID, state: PendingTransactionState.NEW },
      ],
    })
    if (openSenderPendingTx > 0 || openReceiverPendingTx > 0) {
      throw new LogError(
        `There exist still ongoing 'Pending-Transactions' for the involved users on receiver-side!`,
      )
    }

    try {
      const txDate = new Date(args.creationDate)
      const receiveBalance = await calculateRecipientBalance(receiverUser.id, args.amount, txDate)
      const pendingTx = DbPendingTransaction.create()
      pendingTx.amount = args.amount
      pendingTx.balance = receiveBalance ? receiveBalance.balance : args.amount
      pendingTx.balanceDate = txDate
      pendingTx.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      pendingTx.decayStart = receiveBalance ? receiveBalance.decay.start : null
      pendingTx.creationDate = new Date()
      pendingTx.linkedUserCommunityUuid = args.senderCommunityUuid
      pendingTx.linkedUserGradidoID = args.senderUserUuid
      pendingTx.linkedUserName = args.senderUserName
      pendingTx.memo = args.memo
      pendingTx.previous = receiveBalance ? receiveBalance.lastTransactionId : null
      pendingTx.state = PendingTransactionState.NEW
      pendingTx.typeId = TransactionTypeId.RECEIVE
      pendingTx.userId = receiverUser.id
      pendingTx.userCommunityUuid = args.recipientCommunityUuid
      pendingTx.userGradidoID = receiverUser.gradidoID
      pendingTx.userName = fullName(receiverUser.firstName, receiverUser.lastName)

      await DbPendingTransaction.insert(pendingTx)
      result.vote = true
      result.recipFirstName = receiverUser.firstName
      result.recipLastName = receiverUser.lastName
      result.recipAlias = receiverUser.alias
      result.recipGradidoID = receiverUser.gradidoID
      logger.debug(`voteForSendCoins()-1_0... successfull`)
    } catch (err) {
      throw new LogError(`Error in voteForSendCoins: `, err)
    }
    return result
  }

  @Mutation(() => Boolean)
  async revertSendCoins(
    @Arg('data')
    args: SendCoinsArgs,
  ): Promise<boolean> {
    logger.debug(`revertSendCoins() via apiVersion=1_0 ...`)
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: args.recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `revertSendCoins with wrong recipientCommunityUuid`,
        args.recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(args.recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `revertSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    try {
      const pendingTx = await DbPendingTransaction.findOneBy({
        userCommunityUuid: args.recipientCommunityUuid,
        userGradidoID: receiverUser.gradidoID,
        state: PendingTransactionState.NEW,
        typeId: TransactionTypeId.RECEIVE,
        balanceDate: new Date(args.creationDate),
        linkedUserCommunityUuid: args.senderCommunityUuid,
        linkedUserGradidoID: args.senderUserUuid,
      })
      logger.debug(
        'XCom: revertSendCoins found pendingTX=',
        pendingTx ? new PendingTransactionLoggingView(pendingTx) : 'null',
      )
      if (pendingTx && pendingTx.amount.toString() === args.amount.toString()) {
        logger.debug('XCom: revertSendCoins matching pendingTX for remove...')
        try {
          await pendingTx.remove()
          logger.debug('XCom: revertSendCoins pendingTX for remove successfully')
        } catch (err) {
          throw new LogError('Error in revertSendCoins on removing pendingTx of receiver: ', err)
        }
      } else {
        logger.debug(
          'XCom: revertSendCoins NOT matching pendingTX for remove:',
          pendingTx?.amount.toString(),
          args.amount.toString(),
        )
        throw new LogError(`Can't find in revertSendCoins the pending receiver TX for `, {
          args: new SendCoinsArgsLoggingView(args),
          pendingTransactionState: PendingTransactionState.NEW,
          transactionType: TransactionTypeId.RECEIVE,
        })
      }
      logger.debug(`revertSendCoins()-1_0... successfull`)
      return true
    } catch (err) {
      throw new LogError(`Error in revertSendCoins: `, err)
    }
  }

  @Mutation(() => Boolean)
  async settleSendCoins(
    @Arg('data')
    args: SendCoinsArgs,
  ): Promise<boolean> {
    logger.debug(`settleSendCoins() via apiVersion=1_0 ...`, new SendCoinsArgsLoggingView(args))
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: args.recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `settleSendCoins with wrong recipientCommunityUuid`,
        args.recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(args.recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `settleSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: args.recipientCommunityUuid,
      userGradidoID: receiverUser.gradidoID,
      state: PendingTransactionState.NEW,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(args.creationDate),
      linkedUserCommunityUuid: args.senderCommunityUuid,
      linkedUserGradidoID: args.senderUserUuid,
    })
    logger.debug(
      'XCom: settleSendCoins found pendingTX=',
      pendingTx ? new PendingTransactionLoggingView(pendingTx) : 'null',
    )
    if (
      pendingTx &&
      pendingTx.amount.toString() === args.amount.toString() &&
      pendingTx.memo === args.memo
    ) {
      logger.debug('XCom: settleSendCoins matching pendingTX for settlement...')

      await settlePendingReceiveTransaction(homeCom, receiverUser, pendingTx)
      // after successful x-com-tx store the recipient as foreign user
      logger.debug('store recipient as foreign user...')
      if (await storeForeignUser(args)) {
        logger.info(
          'X-Com: new foreign user inserted successfully...',
          args.senderCommunityUuid,
          args.senderUserUuid,
        )
      }

      logger.debug(`XCom: settlePendingReceiveTransaction()-1_0... successfull`)
      return true
    } else {
      logger.debug('XCom: settlePendingReceiveTransaction NOT matching pendingTX for settlement...')
      throw new LogError(
        `Can't find in settlePendingReceiveTransaction the pending receiver TX for `,
        {
          args: new SendCoinsArgsLoggingView(args),
          pendingTransactionState: PendingTransactionState.NEW,
          transactionTypeId: TransactionTypeId.RECEIVE,
        },
      )
    }
  }

  @Mutation(() => Boolean)
  async revertSettledSendCoins(
    @Arg('data')
    args: SendCoinsArgs,
  ): Promise<boolean> {
    logger.debug(`revertSettledSendCoins() via apiVersion=1_0 ...`)
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: args.recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `revertSettledSendCoins with wrong recipientCommunityUuid`,
        args.recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(args.recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `revertSettledSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: args.recipientCommunityUuid,
      userGradidoID: args.recipientUserIdentifier,
      state: PendingTransactionState.SETTLED,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(args.creationDate),
      linkedUserCommunityUuid: args.senderCommunityUuid,
      linkedUserGradidoID: args.senderUserUuid,
    })
    logger.debug(
      'XCom: revertSettledSendCoins found pendingTX=',
      pendingTx ? new PendingTransactionLoggingView(pendingTx) : 'null',
    )
    if (
      pendingTx &&
      pendingTx.amount.toString() === args.amount.toString() &&
      pendingTx.memo === args.memo
    ) {
      logger.debug('XCom: revertSettledSendCoins matching pendingTX for remove...')
      try {
        await revertSettledReceiveTransaction(homeCom, receiverUser, pendingTx)
        logger.debug('XCom: revertSettledSendCoins pendingTX successfully')
      } catch (err) {
        throw new LogError('Error in revertSettledSendCoins of receiver: ', err)
      }
    } else {
      logger.debug('XCom: revertSettledSendCoins NOT matching pendingTX...')
      throw new LogError(`Can't find in revertSettledSendCoins the pending receiver TX for `, {
        args: new SendCoinsArgsLoggingView(args),
        pendingTransactionState: PendingTransactionState.SETTLED,
        transactionTypeId: TransactionTypeId.RECEIVE,
      })
    }
    logger.debug(`revertSendCoins()-1_0... successfull`)
    return true
  }
}
