// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Args, Mutation, Resolver } from 'type-graphql'
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

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class SendCoinsResolver {
  @Mutation(() => String)
  async voteForSendCoins(
    @Args()
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
  ): Promise<string> {
    logger.debug(
      `voteForSendCoins() via apiVersion=1_0 ...`,
      recipientCommunityUuid,
      recipientUserIdentifier,
      creationDate,
      amount.toString(),
      memo,
      senderCommunityUuid,
      senderUserUuid,
      senderUserName,
    )
    let result: string
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `voteForSendCoins with wrong recipientCommunityUuid`,
        recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `voteForSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    try {
      const txDate = new Date(creationDate)
      const receiveBalance = await calculateRecipientBalance(receiverUser.id, amount, txDate)
      const pendingTx = DbPendingTransaction.create()
      pendingTx.amount = amount
      pendingTx.balance = receiveBalance ? receiveBalance.balance : amount
      pendingTx.balanceDate = txDate
      pendingTx.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      pendingTx.decayStart = receiveBalance ? receiveBalance.decay.start : null
      pendingTx.creationDate = new Date()
      pendingTx.linkedUserCommunityUuid = senderCommunityUuid
      pendingTx.linkedUserGradidoID = senderUserUuid
      pendingTx.linkedUserName = senderUserName
      pendingTx.memo = memo
      pendingTx.previous = receiveBalance ? receiveBalance.lastTransactionId : null
      pendingTx.state = PendingTransactionState.NEW
      pendingTx.typeId = TransactionTypeId.RECEIVE
      pendingTx.userId = receiverUser.id
      pendingTx.userCommunityUuid = recipientCommunityUuid
      pendingTx.userGradidoID = receiverUser.gradidoID
      pendingTx.userName = fullName(receiverUser.firstName, receiverUser.lastName)

      await DbPendingTransaction.insert(pendingTx)
      result = pendingTx.userName
      logger.debug(`voteForSendCoins()-1_0... successfull`)
    } catch (err) {
      throw new LogError(`Error in voteForSendCoins: `, err)
    }
    return result
  }

  @Mutation(() => Boolean)
  async revertSendCoins(
    @Args()
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
  ): Promise<boolean> {
    logger.debug(`revertSendCoins() via apiVersion=1_0 ...`)
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `revertSendCoins with wrong recipientCommunityUuid`,
        recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `revertSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    try {
      const pendingTx = await DbPendingTransaction.findOneBy({
        userCommunityUuid: recipientCommunityUuid,
        userGradidoID: receiverUser.gradidoID,
        state: PendingTransactionState.NEW,
        typeId: TransactionTypeId.RECEIVE,
        balanceDate: new Date(creationDate),
        linkedUserCommunityUuid: senderCommunityUuid,
        linkedUserGradidoID: senderUserUuid,
      })
      logger.debug('XCom: revertSendCoins found pendingTX=', pendingTx)
      if (pendingTx && pendingTx.amount.toString() === amount.toString()) {
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
          amount,
        )
        throw new LogError(
          `Can't find in revertSendCoins the pending receiver TX for args=`,
          recipientCommunityUuid,
          recipientUserIdentifier,
          PendingTransactionState.NEW,
          TransactionTypeId.RECEIVE,
          creationDate,
          amount,
          memo,
          senderCommunityUuid,
          senderUserUuid,
          senderUserName,
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
    @Args()
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
  ): Promise<boolean> {
    logger.debug(
      `settleSendCoins() via apiVersion=1_0 ...userCommunityUuid=${recipientCommunityUuid}, userGradidoID=${recipientUserIdentifier}, balanceDate=${creationDate},amount=${amount.valueOf()}, memo=${memo}, linkedUserCommunityUuid = ${senderCommunityUuid}, userSenderIdentifier=${senderUserUuid}, userSenderName=${senderUserName}`,
    )
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `settleSendCoins with wrong recipientCommunityUuid`,
        recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `settleSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: recipientCommunityUuid,
      userGradidoID: receiverUser.gradidoID,
      state: PendingTransactionState.NEW,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(creationDate),
      linkedUserCommunityUuid: senderCommunityUuid,
      linkedUserGradidoID: senderUserUuid,
    })
    logger.debug('XCom: settleSendCoins found pendingTX=', pendingTx?.toString())
    if (pendingTx && pendingTx.amount.toString() === amount.toString() && pendingTx.memo === memo) {
      logger.debug('XCom: settleSendCoins matching pendingTX for settlement...')

      await settlePendingReceiveTransaction(homeCom, receiverUser, pendingTx)
      logger.debug(`XCom: settlePendingReceiveTransaction()-1_0... successfull`)
      return true
    } else {
      logger.debug('XCom: settlePendingReceiveTransaction NOT matching pendingTX for settlement...')
      throw new LogError(
        `Can't find in settlePendingReceiveTransaction the pending receiver TX for args=`,
        recipientCommunityUuid,
        recipientUserIdentifier,
        PendingTransactionState.NEW,
        TransactionTypeId.RECEIVE,
        creationDate,
        amount,
        memo,
        senderCommunityUuid,
        senderUserUuid,
        senderUserName,
      )
    }
  }

  @Mutation(() => Boolean)
  async revertSettledSendCoins(
    @Args()
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
  ): Promise<boolean> {
    logger.debug(`revertSettledSendCoins() via apiVersion=1_0 ...`)
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: recipientCommunityUuid,
    })
    if (!homeCom) {
      throw new LogError(
        `revertSettledSendCoins with wrong recipientCommunityUuid`,
        recipientCommunityUuid,
      )
    }
    let receiverUser
    try {
      // second check if receiver user exists in this community
      receiverUser = await findUserByIdentifier(recipientUserIdentifier)
    } catch (err) {
      logger.error('Error in findUserByIdentifier:', err)
      throw new LogError(
        `revertSettledSendCoins with unknown recipientUserIdentifier in the community=`,
        homeCom.name,
      )
    }
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: recipientCommunityUuid,
      userGradidoID: receiverUser.gradidoID,
      state: PendingTransactionState.SETTLED,
      typeId: TransactionTypeId.RECEIVE,
      balanceDate: new Date(creationDate),
      linkedUserCommunityUuid: senderCommunityUuid,
      linkedUserGradidoID: senderUserUuid,
    })
    logger.debug('XCom: revertSettledSendCoins found pendingTX=', pendingTx)
    if (pendingTx && pendingTx.amount.toString() === amount.toString() && pendingTx.memo === memo) {
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
        recipientCommunityUuid,
        recipientUserIdentifier,
        PendingTransactionState.SETTLED,
        TransactionTypeId.RECEIVE,
        creationDate,
        amount,
        memo,
        senderCommunityUuid,
        senderUserUuid,
        senderUserName,
      )
    }
    logger.debug(`revertSendCoins()-1_0... successfull`)
    return true
  }
}
