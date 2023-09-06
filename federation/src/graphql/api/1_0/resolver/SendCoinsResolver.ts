// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Args, Mutation, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { SendCoinsArgs } from '../model/SendCoinsArgs'
import { User as DbUser } from '@entity/User'
import { LogError } from '@/server/LogError'
import { PendingTransactionState } from '../enum/PendingTransactionState'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { calculateRecipientBalance } from '@/graphql/util/calculateRecipientBalance'
import Decimal from 'decimal.js-light'
import { fullName } from '@/graphql/util/fullName'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class SendCoinsResolver {
  @Mutation(() => String)
  async voteForSendCoins(
    @Args()
    {
      communityReceiverIdentifier,
      userReceiverIdentifier,
      creationDate,
      amount,
      memo,
      communitySenderIdentifier,
      userSenderIdentifier,
      userSenderName,
    }: SendCoinsArgs,
  ): Promise<string | null> {
    logger.debug(`voteForSendCoins() via apiVersion=1_0 ...`)
    let result: string | null = null
    // first check if receiver community is correct
    const homeCom = await DbCommunity.findOneBy({
      communityUuid: communityReceiverIdentifier,
    })
    if (!homeCom) {
      throw new LogError(
        `voteForSendCoins with wrong communityReceiverIdentifier`,
        communityReceiverIdentifier,
      )
    }
    // second check if receiver user exists in this community
    const receiverUser = await DbUser.findOneBy({ gradidoID: userReceiverIdentifier })
    if (!receiverUser) {
      throw new LogError(
        `voteForSendCoins with unknown userReceiverIdentifier in the community=`,
        homeCom.name,
      )
    }
    try {
      const txDate = new Date(creationDate)
      const receiveBalance = await calculateRecipientBalance(receiverUser.id, amount, txDate)
      const pendingTx = DbPendingTransaction.create()
      pendingTx.amount = amount
      pendingTx.balance = receiveBalance ? receiveBalance.balance : new Decimal(0)
      pendingTx.balanceDate = txDate
      pendingTx.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      pendingTx.decayStart = receiveBalance ? receiveBalance.decay.start : null
      pendingTx.linkedUserCommunityUuid = communitySenderIdentifier
      pendingTx.linkedUserGradidoID = userSenderIdentifier
      pendingTx.linkedUserName = userSenderName
      pendingTx.memo = memo
      pendingTx.previous = receiveBalance ? receiveBalance.lastTransactionId : null
      pendingTx.state = PendingTransactionState.NEW
      pendingTx.typeId = TransactionTypeId.RECEIVE
      pendingTx.userId = receiverUser.id
      pendingTx.userCommunityUuid = communityReceiverIdentifier
      pendingTx.userGradidoID = userReceiverIdentifier
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
      communityReceiverIdentifier,
      userReceiverIdentifier,
      creationDate,
      amount,
      memo,
      communitySenderIdentifier,
      userSenderIdentifier,
      userSenderName,
    }: SendCoinsArgs,
  ): Promise<boolean> {
    logger.debug(`revertSendCoins() via apiVersion=1_0 ...`)
    try {
      // first check if receiver community is correct
      const homeCom = await DbCommunity.findOneBy({
        communityUuid: communityReceiverIdentifier,
      })
      if (!homeCom) {
        throw new LogError(
          `revertSendCoins with wrong communityReceiverIdentifier`,
          communityReceiverIdentifier,
        )
      }
      // second check if receiver user exists in this community
      const receiverUser = await DbUser.findOneBy({ gradidoID: userReceiverIdentifier })
      if (!receiverUser) {
        throw new LogError(
          `revertSendCoins with unknown userReceiverIdentifier in the community=`,
          homeCom.name,
        )
      }
      const pendingTx = await DbPendingTransaction.findOneBy({
        userCommunityUuid: communityReceiverIdentifier,
        userGradidoID: userReceiverIdentifier,
        state: PendingTransactionState.NEW,
        typeId: TransactionTypeId.RECEIVE,
        balanceDate: creationDate,
        linkedUserCommunityUuid: communitySenderIdentifier,
        linkedUserGradidoID: userSenderIdentifier,
      })
      logger.debug('XCom: revertSendCoins found pendingTX=', pendingTx)
      if (pendingTx && pendingTx.amount === amount) {
        logger.debug('XCom: revertSendCoins matching pendingTX for remove...')
        try {
          await pendingTx.remove()
          logger.debug('XCom: revertSendCoins pendingTX for remove successfully')
        } catch (err) {
          throw new LogError('Error in revertSendCoins on removing pendingTx of receiver: ', err)
        }
      } else {
        logger.debug('XCom: revertSendCoins NOT matching pendingTX for remove...')
        throw new LogError(
          `Can't find in revertSendCoins the pending receiver TX for args=`,
          communityReceiverIdentifier,
          userReceiverIdentifier,
          PendingTransactionState.NEW,
          TransactionTypeId.RECEIVE,
          creationDate,
          amount,
          memo,
          communitySenderIdentifier,
          userSenderIdentifier,
          userSenderName,
        )
      }
      logger.debug(`revertSendCoins()-1_0... successfull`)
      return true
    } catch (err) {
      throw new LogError(`Error in revertSendCoins: `, err)
    }
  }
}
