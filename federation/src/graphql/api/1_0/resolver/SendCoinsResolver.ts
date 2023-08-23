// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Mutation, Query, Resolver } from 'type-graphql'
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
  @Mutation(() => Boolean)
  async voteForSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug(`voteForSendCoins() via apiVersion=1_0 ...`)
    try {
      // first check if receiver community is correct
      const homeCom = await DbCommunity.findOneBy({
        communityUuid: args.communityReceiverIdentifier,
      })
      if (!homeCom) {
        throw new LogError(`voteForSendCoins with wrong communityReceiverIdentifier`)
      }
      // second check if receiver user exists in this community
      const receiverUser = await DbUser.findOneBy({ gradidoID: args.userReceiverIdentifier })
      if (!receiverUser) {
        throw new LogError(
          `voteForSendCoins with unknown userReceiverIdentifier in the community=`,
          homeCom.name,
        )
      }
      const receiveBalance = await calculateRecepientBalance(
        receiverUser.id,
        args.amount,
        args.creationDate,
      )
      const pendingTx = DbPendingTransaction.create()
      pendingTx.amount = args.amount
      pendingTx.balance = receiveBalance ? receiveBalance.balance : new Decimal(0)
      pendingTx.balanceDate = args.creationDate
      pendingTx.decay = receiveBalance ? receiveBalance.decay.decay : new Decimal(0)
      pendingTx.decayStart = receiveBalance ? receiveBalance.decay.start : null
      pendingTx.linkedUserCommunityUuid = args.communitySenderIdentifier
      pendingTx.linkedUserGradidoID = args.userSenderIdentifier
      pendingTx.linkedUserName = args.userSenderName
      pendingTx.memo = args.memo
      pendingTx.previous = receiveBalance ? receiveBalance.lastTransactionId : null
      pendingTx.state = PendingTransactionState.NEW
      pendingTx.typeId = TransactionTypeId.RECEIVE
      pendingTx.userCommunityUuid = args.communityReceiverIdentifier
      pendingTx.userGradidoID = args.userReceiverIdentifier
      pendingTx.userName = fullName(receiverUser.firstName, receiverUser.lastName)

      await DbPendingTransaction.insert(pendingTx)
      logger.debug(`voteForSendCoins()-1_0... successfull`)
    } catch (err) {
      throw new LogError(`Error in voteForSendCoins with args=`, args)
    }
    return true
  }
}
