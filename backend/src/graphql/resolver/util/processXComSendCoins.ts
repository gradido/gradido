import {
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  PendingTransaction as DbPendingTransaction,
  User as dbUser,
  PendingTransactionLoggingView,
  CommunityLoggingView,
  UserLoggingView,
} from 'database'
import { Decimal } from 'decimal.js-light'

import { CONFIG } from '@/config'

import { SendCoinsClient as V1_0_SendCoinsClient } from '@/federation/client/1_0/SendCoinsClient'
import { SendCoinsArgs } from '@/federation/client/1_0/model/SendCoinsArgs'
import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'
import { SendCoinsClientFactory } from '@/federation/client/SendCoinsClientFactory'
import { PendingTransactionState } from '@/graphql/enum/PendingTransactionState'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'
import { calculateSenderBalance } from '@/util/calculateSenderBalance'
import { fullName } from '@/util/utilities'
import { getLogger } from 'log4js'

import { settlePendingSenderTransaction } from './settlePendingSenderTransaction'
import { SendCoinsArgsLoggingView } from '@/federation/client/1_0/logging/SendCoinsArgsLogging.view'
import { SendCoinsResultLoggingView } from '@/federation/client/1_0/logging/SendCoinsResultLogging.view'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.processXComSendCoins`)

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
    // even if debug is not enabled, attributes are processed so we skip the entire call for performance reasons
    if(logger.isDebugEnabled()) {
      logger.debug(
        'XCom: processXComPendingSendCoins...', {
          receiverCom: new CommunityLoggingView(receiverCom),
          senderCom: new CommunityLoggingView(senderCom),
          amount: amount.toString(),
          memo: memo.substring(0, 5),
          sender: new UserLoggingView(sender),
          recipientIdentifier
        }
      )
    }
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
    if(logger.isDebugEnabled()) {
      logger.debug(`calculated senderBalance = ${JSON.stringify(senderBalance, null, 2)}`)
    }

    const receiverFCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        publicKey: Buffer.from(receiverCom.publicKey),
        apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
      },
    })
    const client = SendCoinsClientFactory.getInstance(receiverFCom)

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
      args.senderAlias = sender.alias
      if(logger.isDebugEnabled()) {
        logger.debug(`ready for voteForSendCoins with args=${new SendCoinsArgsLoggingView(args)}`)
      }
      voteResult = await client.voteForSendCoins(args)
      if(logger.isDebugEnabled()) {
        logger.debug(`returned from voteForSendCoins: ${new SendCoinsResultLoggingView(voteResult)}`)
      }
      if (voteResult.vote) {
        logger.debug('prepare pendingTransaction for sender...')
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
          if (voteResult.recipFirstName && voteResult.recipLastName) {
            pendingTx.linkedUserName = fullName(voteResult.recipFirstName, voteResult.recipLastName)
          }
          pendingTx.memo = memo
          pendingTx.previous = senderBalance ? senderBalance.lastTransactionId : null
          pendingTx.state = PendingTransactionState.NEW
          pendingTx.typeId = TransactionTypeId.SEND
          if (senderCom.communityUuid) {
            pendingTx.userCommunityUuid = senderCom.communityUuid
          }
          pendingTx.userId = sender.id
          pendingTx.userGradidoID = sender.gradidoID
          pendingTx.userName = fullName(sender.firstName, sender.lastName)
          if(logger.isDebugEnabled()) {
            logger.debug(`initialized sender pendingTX=${new PendingTransactionLoggingView(pendingTx)}`)
          }

          await DbPendingTransaction.insert(pendingTx)
          logger.debug('sender pendingTx successfully inserted...')
        } catch (err) {
          logger.error(`Error in writing sender pending transaction: ${JSON.stringify(err, null, 2)}`)
          // revert the existing pending transaction on receiver side
          let revertCount = 0
          logger.debug('first try to revertSendCoins of receiver')
          do {
            if (await client.revertSendCoins(args)) {
              logger.debug(`revertSendCoins()-1_0... successfull after revertCount=${revertCount}`)
              // treat revertingSendCoins as an error of the whole sendCoins-process
              throw new LogError('Error in writing sender pending transaction: ', err)
            }
          } while (CONFIG.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
          throw new LogError(
            `Error in reverting receiver pending transaction even after revertCount=${revertCount}`,
            err,
          )
        }
        logger.debug('voteForSendCoins()-1_0... successfull')
      } else {
        logger.error(`break with error on writing pendingTransaction for recipient... ${new SendCoinsResultLoggingView(voteResult)}`)
      }
      return voteResult
    }
  } catch (err: any) {
    throw new LogError(`Error: ${err.message}`, err)
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
  recipient: SendCoinsResult,
): Promise<SendCoinsResult> {
  const sendCoinsResult = new SendCoinsResult()
  try {
    if(logger.isDebugEnabled()) {
      logger.debug(
        'XCom: processXComCommittingSendCoins...', {
          receiverCom: new CommunityLoggingView(receiverCom),
          senderCom: new CommunityLoggingView(senderCom),
          creationDate: creationDate.toISOString(),
          amount: amount.toString(),
          memo: memo.substring(0, 5),
          sender: new UserLoggingView(sender),
          recipient: new SendCoinsResultLoggingView(recipient),
        }
      )
    }
    // first find pending Tx with given parameters
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: senderCom.communityUuid ?? 'homeCom-UUID',
      userGradidoID: sender.gradidoID,
      userName: fullName(sender.firstName, sender.lastName),
      linkedUserCommunityUuid:
        receiverCom.communityUuid ?? CONFIG.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID,
      linkedUserGradidoID: recipient.recipGradidoID ? recipient.recipGradidoID : undefined,
      typeId: TransactionTypeId.SEND,
      state: PendingTransactionState.NEW,
      balanceDate: creationDate,
      memo,
    })
    if (pendingTx) {
      if(logger.isDebugEnabled()) {
        logger.debug(`find pending Tx for settlement: ${new PendingTransactionLoggingView(pendingTx)}`)
      }
      const receiverFCom = await DbFederatedCommunity.findOneOrFail({
        where: {
          publicKey: Buffer.from(receiverCom.publicKey),

          apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
        },
      })
      const client = SendCoinsClientFactory.getInstance(receiverFCom)

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
        args.senderAlias = sender.alias
        if(logger.isDebugEnabled()) {
          logger.debug(`ready for settleSendCoins with args=${new SendCoinsArgsLoggingView(args)}`)
        }
        const acknowledge = await client.settleSendCoins(args)
        logger.debug(`returnd from settleSendCoins: ${acknowledge}`)
        if (acknowledge) {
          // settle the pending transaction on receiver-side was successfull, so now settle the sender side
          try {
            sendCoinsResult.vote = await settlePendingSenderTransaction(
              senderCom,
              sender,
              pendingTx,
            )
            if (sendCoinsResult.vote) {
              if (pendingTx.linkedUserName) {
                sendCoinsResult.recipFirstName = pendingTx.linkedUserName.slice(
                  0,
                  pendingTx.linkedUserName.indexOf(' '),
                )
                sendCoinsResult.recipLastName = pendingTx.linkedUserName.slice(
                  pendingTx.linkedUserName.indexOf(' '),
                  pendingTx.linkedUserName.length,
                )
              }
              sendCoinsResult.recipGradidoID = pendingTx.linkedUserGradidoID
              sendCoinsResult.recipAlias = recipient.recipAlias
            }
          } catch (err) {
            logger.error(`Error in writing sender pending transaction: ${JSON.stringify(err, null, 2)}`)
            // revert the existing pending transaction on receiver side
            let revertCount = 0
            logger.debug('first try to revertSetteledSendCoins of receiver')
            do {
              if (await client.revertSettledSendCoins(args)) {
                logger.debug(
                  `revertSettledSendCoins()-1_0... successfull after revertCount=${revertCount}`,
                )
                // treat revertingSettledSendCoins as an error of the whole sendCoins-process
                throw new LogError('Error in settle sender pending transaction: ', err)
              }
            } while (CONFIG.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
            throw new LogError(
              `Error in reverting receiver pending transaction even after revertCount=${revertCount}`,
              err,
            )
          }
        }
      }
    }
  } catch (err) {
    logger.error(`Error: ${JSON.stringify(err, null, 2)}`)
    sendCoinsResult.vote = false
  }
  return sendCoinsResult
}
