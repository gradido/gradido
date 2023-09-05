// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Args, Mutation, Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { SendCoinsArgs } from '../model/SendCoinsArgs'
import { User as DbUser } from '@entity/User'
import { LogError } from '@/server/LogError'
import { PendingTransactionState } from '../enum/PendingTransactionState'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { calculateRecepientBalance } from '@/graphql/util/calculateRecepientBalance'
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
      const receiveBalance = await calculateRecepientBalance(receiverUser.id, amount, txDate)
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
}
