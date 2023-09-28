import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { PendingTransaction as DbPendingTransaction } from '@entity/PendingTransaction'
import { User as dbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { CONFIG } from '@/config'
import { SendCoinsArgs } from '@/federation/client/1_0/model/SendCoinsArgs'
import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'
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
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipientIdentifier: string,
): Promise<SendCoinsResult> {
  let voteResult: SendCoinsResult
  try {
    logger.debug(
      `XCom: processXComPendingSendCoins...`,
      receiverCom,
      senderCom,
      amount,
      memo,
      sender,
      recipientIdentifier,
    )
    const openSenderPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: sender.gradidoID, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: sender.gradidoID, state: PendingTransactionState.NEW },
      ],
    })
    const openReceiverPendingTx = await DbPendingTransaction.count({
      where: [
        { userGradidoID: recipientIdentifier, state: PendingTransactionState.NEW },
        { linkedUserGradidoID: recipientIdentifier, state: PendingTransactionState.NEW },
      ],
    })
    if (openSenderPendingTx > 0 || openReceiverPendingTx > 0) {
      throw new LogError(
        `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`,
      )
    }
    // first calculate the sender balance and check if the transaction is allowed
    const senderBalance = await calculateSenderBalance(sender.id, amount.mul(-1), creationDate)
    if (!senderBalance) {
      throw new LogError('User has not enough GDD or amount is < 0', senderBalance)
    }
    logger.debug(`X-Com: calculated senderBalance = `, senderBalance)

    const receiverFCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        publicKey: receiverCom.publicKey,
        apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
      },
    })
    const client = SendCoinsClientFactory.getInstance(receiverFCom)
    // eslint-disable-next-line camelcase
    if (client instanceof V1_0_SendCoinsClient) {
      const args = new SendCoinsArgs()
      if (receiverCom.communityUuid) {
        args.recipientCommunityUuid = receiverCom.communityUuid
      }
      args.recipientUserIdentifier = recipientIdentifier
      args.creationDate = creationDate.toISOString()
      args.amount = amount
      args.memo = memo
      if (senderCom.communityUuid) {
        args.senderCommunityUuid = senderCom.communityUuid
      }
      args.senderUserUuid = sender.gradidoID
      args.senderUserName = fullName(sender.firstName, sender.lastName)
      logger.debug(`X-Com: ready for voteForSendCoins with args=`, args)
      voteResult = await client.voteForSendCoins(args)
      logger.debug(`X-Com: returnd from voteForSendCoins:`, voteResult)
      if (voteResult.vote) {
        logger.debug(`X-Com: prepare pendingTransaction for sender...`)
        // writing the pending transaction on receiver-side was successfull, so now write the sender side
        try {
          const pendingTx = DbPendingTransaction.create()
          pendingTx.amount = amount.mul(-1)
          pendingTx.balance = senderBalance.balance
          pendingTx.balanceDate = creationDate
          pendingTx.decay = senderBalance ? senderBalance.decay.decay : new Decimal(0)
          pendingTx.decayStart = senderBalance ? senderBalance.decay.start : null
          if (receiverCom.communityUuid) {
            pendingTx.linkedUserCommunityUuid = receiverCom.communityUuid
          }
          if (voteResult.recipGradidoID) {
            pendingTx.linkedUserGradidoID = voteResult.recipGradidoID
          }
          if (voteResult.recipName) {
            pendingTx.linkedUserName = voteResult.recipName
          }
          pendingTx.memo = memo
          pendingTx.previous = senderBalance ? senderBalance.lastTransactionId : null
          pendingTx.state = PendingTransactionState.NEW
          pendingTx.typeId = TransactionTypeId.SEND
          if (senderCom.communityUuid) pendingTx.userCommunityUuid = senderCom.communityUuid
          pendingTx.userId = sender.id
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
      } else {
        logger.debug(
          `X-Com: break with error on writing pendingTransaction for recipient...`,
          voteResult,
        )
      }
      return voteResult
    }
  } catch (err) {
    throw new LogError(`Error:`, err)
  }
  return new SendCoinsResult()
}

export async function processXComCommittingSendCoins(
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipUuid: string,
): Promise<SendCoinsResult> {
  const sendCoinsResult = new SendCoinsResult()
  try {
    logger.debug(
      `XCom: processXComCommittingSendCoins...`,
      receiverCom,
      senderCom,
      creationDate,
      amount,
      memo,
      sender,
      recipUuid,
    )
    // first find pending Tx with given parameters
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: senderCom.communityUuid ?? 'homeCom-UUID',
      userGradidoID: sender.gradidoID,
      userName: fullName(sender.firstName, sender.lastName),
      linkedUserCommunityUuid:
        receiverCom.communityUuid ?? CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID,
      linkedUserGradidoID: recipUuid,
      typeId: TransactionTypeId.SEND,
      state: PendingTransactionState.NEW,
      balanceDate: creationDate,
      memo,
    })
    if (pendingTx) {
      logger.debug(`X-Com: find pending Tx for settlement:`, pendingTx)
      const receiverFCom = await DbFederatedCommunity.findOneOrFail({
        where: {
          publicKey: receiverCom.publicKey,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
        },
      })
      const client = SendCoinsClientFactory.getInstance(receiverFCom)
      // eslint-disable-next-line camelcase
      if (client instanceof V1_0_SendCoinsClient) {
        const args = new SendCoinsArgs()
        args.recipientCommunityUuid = pendingTx.linkedUserCommunityUuid
          ? pendingTx.linkedUserCommunityUuid
          : CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID
        if (pendingTx.linkedUserGradidoID) {
          args.recipientUserIdentifier = pendingTx.linkedUserGradidoID
        }
        args.creationDate = pendingTx.balanceDate.toISOString()
        args.amount = pendingTx.amount.mul(-1)
        args.memo = pendingTx.memo
        args.senderCommunityUuid = pendingTx.userCommunityUuid
        args.senderUserUuid = pendingTx.userGradidoID
        if (pendingTx.userName) {
          args.senderUserName = pendingTx.userName
        }
        logger.debug(`X-Com: ready for settleSendCoins with args=`, args)
        const acknowledge = await client.settleSendCoins(args)
        logger.debug(`X-Com: returnd from settleSendCoins:`, acknowledge)
        if (acknowledge) {
          // settle the pending transaction on receiver-side was successfull, so now settle the sender side
          try {
            sendCoinsResult.vote = await settlePendingSenderTransaction(
              senderCom,
              sender,
              pendingTx,
            )
            if (sendCoinsResult.vote) {
              sendCoinsResult.recipName = pendingTx.linkedUserName
              sendCoinsResult.recipGradidoID = pendingTx.linkedUserGradidoID
            }
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
    sendCoinsResult.vote = false
  }
  return sendCoinsResult
}
