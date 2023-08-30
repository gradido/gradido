import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { User as dbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { CONFIG } from '@/config'
import { SendCoinsArgs } from '@/federation/client/1_0/model/SendCoinsArgs'
// eslint-disable-next-line camelcase
import { SendCoinsClient as V1_0_SendCoinsClient } from '@/federation/client/1_0/SendCoinsClient'
import { SendCoinsClientFactory } from '@/federation/client/SendCoinsClientFactory'
import { PendingTransactionState } from '@/graphql/enum/PendingTransactionState'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { calculateSenderBalance } from '@/util/calculateSenderBalance'
import { fullName } from '@/util/utilities'
import { settlePendingSenderTransaction } from './settlePendingSenderTransaction'

export async function processXComPendingSendCoins(
  receiverFCom: DbFederatedCommunity,
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipient: dbUser,
): Promise<boolean> {
  try {
    logger.debug(
      `XCom: processXComPendingSendCoins...`,
      receiverFCom,
      receiverCom,
      senderCom,
      creationDate,
      amount,
      memo,
      sender,
      recipient,
    )
    // first calculate the sender balance and check if the transaction is allowed
    const senderBalance = await calculateSenderBalance(sender.id, amount.mul(-1), creationDate)
    if (!senderBalance) {
      throw new LogError('User has not enough GDD or amount is < 0', senderBalance)
    }
    logger.debug(`X-Com: calculated senderBalance = `, senderBalance)

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
      logger.debug(`X-Com: ready for voteForSendCoins with args=`, args)
      const recipientName = await client.voteForSendCoins(args)
      logger.debug(`X-Com: returnd from voteForSendCoins:`, recipientName)
      if (recipientName) {
        // writing the pending transaction on receiver-side was successfull, so now write the sender side
        try {
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
          pendingTx.linkedUserName = recipientName
          pendingTx.memo = memo
          pendingTx.previous = senderBalance ? senderBalance.lastTransactionId : null
          pendingTx.state = PendingTransactionState.NEW
          pendingTx.typeId = TransactionTypeId.SEND
          if (senderCom.communityUuid) pendingTx.userCommunityUuid = senderCom.communityUuid
          pendingTx.userGradidoID = sender.gradidoID
          pendingTx.userName = fullName(sender.firstName, sender.lastName)
          logger.debug(`X-Com: initialized sender pendingTX=`, pendingTx)

          await DbPendingTransaction.insert(pendingTx)
          logger.debug(`X-Com: sender pendingTx successfully inserted...`)
        } catch (err) {
          logger.error(`Error in writing sender pending transaction: `, err)
          // revert the existing pending transaction on receiver side
          let revertCount = 0
          logger.debug(`X-Com: first try to revertSendCoins of receiver`)
          do {
            if (await client.revertSendCoins(args)) {
              logger.debug(`revertSendCoins()-1_0... successfull after revertCount=`, revertCount)
              // treat revertingSendCoins as an error of the whole sendCoins-process
              throw new LogError('Error in writing sender pending transaction: `, err')
            }
          } while (CONFIG.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
          throw new LogError(
            `Error in reverting receiver pending transaction even after revertCount=`,
            revertCount,
          )
        }
        logger.debug(`voteForSendCoins()-1_0... successfull`)
      }
    }
  } catch (err) {
    logger.error(`Error:`, err)
  }
  return true
}

export async function processXComCommittingSendCoins(
  receiverFCom: DbFederatedCommunity,
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipient: dbUser,
): Promise<boolean> {
  try {
    logger.debug(
      `XCom: processXComCommittingSendCoins...`,
      receiverFCom,
      receiverCom,
      senderCom,
      creationDate,
      amount,
      memo,
      sender,
      recipient,
    )
    // first find pending Tx with given parameters
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: senderCom.communityUuid ? senderCom.communityUuid : 'homeCom-UUID',
      userGradidoID: sender.gradidoID,
      userName: fullName(sender.firstName, sender.lastName),
      linkedUserCommunityUuid: receiverCom.communityUuid
        ? receiverCom.communityUuid
        : CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID,
      linkedUserGradidoID: recipient.gradidoID,
      typeId: TransactionTypeId.SEND,
      state: PendingTransactionState.NEW,
      balanceDate: creationDate,
      memo,
    })
    if (pendingTx) {
      logger.debug(`X-Com: find pending Tx for settlement:`, pendingTx)
      const client = SendCoinsClientFactory.getInstance(receiverFCom)
      // eslint-disable-next-line camelcase
      if (client instanceof V1_0_SendCoinsClient) {
        const args = new SendCoinsArgs()
        args.communityReceiverIdentifier = pendingTx.linkedUserCommunityUuid
          ? pendingTx.linkedUserCommunityUuid
          : CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID
        if (pendingTx.linkedUserGradidoID) {
          args.userReceiverIdentifier = pendingTx.linkedUserGradidoID
        }
        args.creationDate = pendingTx.balanceDate
        args.amount = pendingTx.amount
        args.memo = pendingTx.memo
        args.communitySenderIdentifier = pendingTx.userCommunityUuid
        args.userSenderIdentifier = pendingTx.userGradidoID
        if (pendingTx.userName) {
          args.userSenderName = pendingTx.userName
        }
        logger.debug(`X-Com: ready for settleSendCoins with args=`, args)
        const acknoleged = await client.settleSendCoins(args)
        logger.debug(`X-Com: returnd from settleSendCoins:`, acknoleged)
        if (acknoleged) {
          // settle the pending transaction on receiver-side was successfull, so now settle the sender side
          try {
            await settlePendingSenderTransaction(senderCom, sender, pendingTx)
          } catch (err) {
            logger.error(`Error in writing sender pending transaction: `, err)
            // revert the existing pending transaction on receiver side
            let revertCount = 0
            logger.debug(`X-Com: first try to revertSetteledSendCoins of receiver`)
            do {
              if (await client.revertSettledSendCoins(args)) {
                logger.debug(
                  `revertSettledSendCoins()-1_0... successfull after revertCount=`,
                  revertCount,
                )
                // treat revertingSettledSendCoins as an error of the whole sendCoins-process
                throw new LogError('Error in settle sender pending transaction: `, err')
              }
            } while (CONFIG.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
            throw new LogError(
              `Error in reverting receiver pending transaction even after revertCount=`,
              revertCount,
            )
          }
        }
      }
    }
  } catch (err) {
    logger.error(`Error:`, err)
  }
  return true
}
