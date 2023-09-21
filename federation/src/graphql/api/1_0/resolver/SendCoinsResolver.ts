// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Arg, Args, Mutation, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { SendCoinsArgs } from '../model/SendCoinsArgs'
import { LogError } from '@/server/LogError'
import { PendingTransactionState } from '../enum/PendingTransactionState'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { calculateRecipientBalance } from '../util/calculateRecipientBalance'
import Decimal from 'decimal.js-light'
import { fullName } from '@/graphql/util/fullName'
import { settlePendingReceiveTransaction } from '../util/settlePendingReceiveTransaction'
// import { checkTradingLevel } from '@/graphql/util/checkTradingLevel'
import { revertSettledReceiveTransaction } from '../util/revertSettledReceiveTransaction'
import { findUserByIdentifier } from '@/graphql/util/findUserByIdentifier'
import { SendCoinsResult } from '../model/SendCoinsResult'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class SendCoinsResolver {
  @Mutation(() => SendCoinsResult)
  async voteForSendCoins(
    @Arg('data')
    args: SendCoinsArgs,
  ): Promise<SendCoinsResult> {
    logger.debug(
      `voteForSendCoins() via apiVersion=1_0 ...`,
      args.recipientCommunityUuid,
      args.recipientUserIdentifier,
      args.creationDate,
      args.amount.toString(),
      args.memo,
      args.senderCommunityUuid,
      args.senderUserUuid,
      args.senderUserName,
    )
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
      receiverUser = await findUserByIdentifier(args.recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `voteForSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
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
      result.recipName = pendingTx.userName
      result.recipGradidoID = pendingTx.userGradidoID
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
    /*
    {
      recipientCommunityUuid,
      recipientUserIdentifier,
      creationDate,
      amount,
      memo,
      senderCommunityUuid,
      senderUserUuid,
      senderUserName,
    }: SendCoinsArgs,
    */
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
      logger.debug('XCom: revertSendCoins found pendingTX=', pendingTx)
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
          pendingTx?.amount,
          args.amount,
        )
        throw new LogError(
          `Can't find in revertSendCoins the pending receiver TX for args=`,
          args.recipientCommunityUuid,
          args.recipientUserIdentifier,
          PendingTransactionState.NEW,
          TransactionTypeId.RECEIVE,
          args.creationDate,
          args.amount,
          args.memo,
          args.senderCommunityUuid,
          args.senderUserUuid,
          args.senderUserName,
        )
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
    /*
    {
      recipientCommunityUuid,
      recipientUserIdentifier,
      creationDate,
      amount,
      memo,
      senderCommunityUuid,
      senderUserUuid,
      senderUserName,
    }: SendCoinsArgs,
    */
  ): Promise<boolean> {
    logger.debug(
      `settleSendCoins() via apiVersion=1_0 ...userCommunityUuid=${
        args.recipientCommunityUuid
      }, userGradidoID=${args.recipientUserIdentifier}, balanceDate=${
        args.creationDate
      },amount=${args.amount.valueOf()}, memo=${args.memo}, linkedUserCommunityUuid = ${
        args.senderCommunityUuid
      }, userSenderIdentifier=${args.senderUserUuid}, userSenderName=${args.senderUserName}`,
    )
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
    logger.debug('XCom: settleSendCoins found pendingTX=', pendingTx?.toString())
    if (
      pendingTx &&
      pendingTx.amount.toString() === args.amount.toString() &&
      pendingTx.memo === args.memo
    ) {
      logger.debug('XCom: settleSendCoins matching pendingTX for settlement...')

      await settlePendingReceiveTransaction(homeCom, receiverUser, pendingTx)
      logger.debug(`XCom: settlePendingReceiveTransaction()-1_0... successfull`)
      return true
    } else {
      logger.debug('XCom: settlePendingReceiveTransaction NOT matching pendingTX for settlement...')
      throw new LogError(
        `Can't find in settlePendingReceiveTransaction the pending receiver TX for args=`,
        args.recipientCommunityUuid,
        args.recipientUserIdentifier,
        PendingTransactionState.NEW,
        TransactionTypeId.RECEIVE,
        args.creationDate,
        args.amount,
        args.memo,
        args.senderCommunityUuid,
        args.senderUserUuid,
        args.senderUserName,
      )
    }
  }

  @Mutation(() => Boolean)
  async revertSettledSendCoins(
    @Arg('data')
    args: SendCoinsArgs,
    /*
    {
      recipientCommunityUuid,
      recipientUserIdentifier,
      creationDate,
      amount,
      memo,
      senderCommunityUuid,
      senderUserUuid,
      senderUserName,
    }: SendCoinsArgs,
    */
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
      userGradidoID: receiverUser.gradidoID,
      state: PendingTransactionState.SETTLED,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(args.creationDate),
      linkedUserCommunityUuid: args.senderCommunityUuid,
      linkedUserGradidoID: args.senderUserUuid,
    })
    logger.debug('XCom: revertSettledSendCoins found pendingTX=', pendingTx)
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
      throw new LogError(
        `Can't find in revertSettledSendCoins the pending receiver TX for args=`,
        args.recipientCommunityUuid,
        args.recipientUserIdentifier,
        PendingTransactionState.SETTLED,
        TransactionTypeId.RECEIVE,
        args.creationDate,
        args.amount,
        args.memo,
        args.senderCommunityUuid,
        args.senderUserUuid,
        args.senderUserName,
      )
    }
    logger.debug(`revertSendCoins()-1_0... successfull`)
    return true
  }
}
