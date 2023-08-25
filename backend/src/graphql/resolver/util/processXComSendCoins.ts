import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { User as dbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { SendCoinsArgs } from '@/federation/client/1_0/model/SendCoinsArgs'
// eslint-disable-next-line camelcase
import { SendCoinsClient as V1_0_SendCoinsClient } from '@/federation/client/1_0/SendCoinsClient'
import { SendCoinsClientFactory } from '@/federation/client/SendCoinsClientFactory'
import { backendLogger as logger } from '@/server/logger'
import { CONFIG } from '@/config'
import { fullName } from '@/util/utilities'
import { calculateSenderBalance } from '@/util/calculateSenderBalance'
import { LogError } from '@/server/LogError'


export async function processXComSendCoins(
  receiverFCom: DbFederatedCommunity,
  senderFCom: DbFederatedCommunity,
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipient: dbUser,
): Promise<boolean> {
  try {
    const senderBalance = await calculateSenderBalance(sender.id, amount.mul(-1), creationDate)
    if (!senderBalance) {
      throw new LogError('User has not enough GDD or amount is < 0', senderBalance)
    }

    const client = SendCoinsClientFactory.getInstance(receiverFCom)
    // eslint-disable-next-line camelcase
    if (client instanceof V1_0_SendCoinsClient) {
      const args = new SendCoinsArgs()
      args.communityReceiverIdentifier = receiverCom.communityUuid
        ? receiverCom.communityUuid
        : CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID
      args.userReceiverIdentifier = recipient.gradidoID
      args.creationDate = creationDate
      args.amount = amount
      args.memo = memo
      args.communitySenderIdentifier = senderCom.communityUuid
        ? senderCom.communityUuid
        : 'homeCom-UUID'
      args.userSenderIdentifier = sender.gradidoID
      args.userSenderName = fullName(sender.firstName, sender.lastName)
      const result = await client.voteForSendCoins(args)
      if(result) {
        const pendingTx = DbPendingTransaction.create()
        pendingTx.amount = amount.mul(-1)
        pendingTx.balance = senderBalance ? senderBalance.balance : new Decimal(0)
        pendingTx.balanceDate = creationDate
        pendingTx.decay = senderBalance ? senderBalance.decay.decay : new Decimal(0)
        pendingTx.decayStart = senderBalance ? senderBalance.decay.start : null
        pendingTx.linkedUserCommunityUuid = receiverCom.communityUuid
          ? receiverCom.communityUuid
          : CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID
        pendingTx.linkedUserGradidoID = recipient.gradidoID
        pendingTx.linkedUserName = userSenderName
        pendingTx.memo = memo
        pendingTx.previous = receiveBalance ? receiveBalance.lastTransactionId : null
        pendingTx.state = PendingTransactionState.NEW
        pendingTx.typeId = TransactionTypeId.RECEIVE
        pendingTx.userCommunityUuid = communityReceiverIdentifier
        pendingTx.userGradidoID = userReceiverIdentifier
        pendingTx.userName = fullName(receiverUser.firstName, receiverUser.lastName)

        await DbPendingTransaction.insert(pendingTx)
        logger.debug(`voteForSendCoins()-1_0... successfull`)
      }
    }
  } catch (err) {
    logger.error(`Error:`, err)
  }
  return true
}
