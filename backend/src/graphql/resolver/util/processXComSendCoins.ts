import {
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  PendingTransaction as DbPendingTransaction,
  User as dbUser,
  PendingTransactionLoggingView,
  CommunityLoggingView,
  UserLoggingView,
  countOpenPendingTransactions,
} from 'database'
import { Decimal } from 'decimal.js-light'

import { CONFIG } from '@/config'

import { SendCoinsClient as V1_0_SendCoinsClient } from '@/federation/client/1_0/SendCoinsClient'
import { SendCoinsArgs } from '@/federation/client/1_0/model/SendCoinsArgs'
import { SendCoinsResult } from '@/federation/client/1_0/model/SendCoinsResult'
import { SendCoinsClientFactory } from '@/federation/client/SendCoinsClientFactory'
import { encryptAndSign, PendingTransactionState, SendCoinsJwtPayloadType, SendCoinsResponseJwtPayloadType, verifyAndDecrypt } from 'shared'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'
import { calculateSenderBalance } from '@/util/calculateSenderBalance'
import { fullName } from '@/util/utilities'
import { getLogger } from 'log4js'

import { settlePendingSenderTransaction } from './settlePendingSenderTransaction'
import { SendCoinsArgsLoggingView } from '@/federation/client/1_0/logging/SendCoinsArgsLogging.view'
import { SendCoinsResultLoggingView } from '@/federation/client/1_0/logging/SendCoinsResultLogging.view'
import { EncryptedTransferArgs } from 'core'
import { randombytes_random } from 'sodium-native'

const createLogger = (method: string) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.processXComSendCoins.${method}`)

export async function processXComPendingSendCoins(
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipientIdentifier: string,
): Promise<SendCoinsResponseJwtPayloadType | null> {
  let voteResult: SendCoinsResponseJwtPayloadType
  const methodLogger = createLogger(`processXComPendingSendCoins`)
  try {
    // even if debug is not enabled, attributes are processed so we skip the entire call for performance reasons
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(
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
    if (await countOpenPendingTransactions([sender.gradidoID, recipientIdentifier]) > 0) {
      const errmsg = `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`
      methodLogger.error(errmsg)
      throw new LogError(errmsg)
    }
    const handshakeID = randombytes_random().toString()
    methodLogger.addContext('handshakeID', handshakeID)
    // first calculate the sender balance and check if the transaction is allowed
    const senderBalance = await calculateSenderBalance(sender.id, amount.mul(-1), creationDate)
    if (!senderBalance) {
      const errmsg = `User has not enough GDD or amount is < 0`
      methodLogger.error(errmsg)
      throw new LogError(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`calculated senderBalance = ${JSON.stringify(senderBalance, null, 2)}`)
    }

    const receiverFCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        publicKey: Buffer.from(receiverCom.publicKey),
        apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
      },
    })
    const client = SendCoinsClientFactory.getInstance(receiverFCom)

    if (client instanceof V1_0_SendCoinsClient) {
      const payload = new SendCoinsJwtPayloadType(handshakeID,
        receiverCom.communityUuid!,
        recipientIdentifier,
        creationDate.toISOString(),
        amount,
        memo,
        senderCom.communityUuid!,
        sender.gradidoID,
        fullName(sender.firstName, sender.lastName),
        sender.alias
      )
      if(methodLogger.isDebugEnabled()) {
        methodLogger.debug(`ready for voteForSendCoins with payload=${payload}`)
      }
      const jws = await encryptAndSign(payload, senderCom.privateJwtKey!, receiverCom.publicJwtKey!)
      if(methodLogger.isDebugEnabled()) {
        methodLogger.debug('jws', jws)
      }
      // prepare the args for the client invocation
      const args = new EncryptedTransferArgs()
      args.publicKey = senderCom.publicKey.toString('hex')
      args.jwt = jws
      args.handshakeID = handshakeID
      if(methodLogger.isDebugEnabled()) {
        methodLogger.debug('before client.voteForSendCoins() args:', args)
      }

      const responseJwt = await client.voteForSendCoins(args)
      if(methodLogger.isDebugEnabled()) {
        methodLogger.debug(`response of voteForSendCoins():`, responseJwt)
      }
      if (responseJwt !== null) {
        voteResult = await verifyAndDecrypt(handshakeID, responseJwt, senderCom.privateJwtKey!, receiverCom.publicJwtKey!) as SendCoinsResponseJwtPayloadType
        if(methodLogger.isDebugEnabled()) {
          methodLogger.debug(`received payload from voteForSendCoins():`, voteResult)
        }
        if (voteResult && voteResult.tokentype !== SendCoinsResponseJwtPayloadType.SEND_COINS_RESPONSE_TYPE) {
          const errmsg = `Invalid tokentype in voteForSendCoins-response of community with publicKey` + receiverCom.publicKey
          methodLogger.error(errmsg)
          throw new Error('Error in X-Com-TX protocol...')
        }
        if (voteResult && voteResult.vote) {
          methodLogger.debug('prepare pendingTransaction for sender...')
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
            if(methodLogger.isDebugEnabled()) {
              methodLogger.debug(`initialized sender pendingTX=${new PendingTransactionLoggingView(pendingTx)}`)
            }

            await DbPendingTransaction.insert(pendingTx)
            methodLogger.debug('sender pendingTx successfully inserted...')
          } catch (err) {
            methodLogger.error(`Error in writing sender pending transaction: ${JSON.stringify(err, null, 2)}`)
            // revert the existing pending transaction on receiver side
            let revertCount = 0
            methodLogger.debug('first try to revertSendCoins of receiver')
            do {
              if (await client.revertSendCoins(args)) {
                methodLogger.debug(`revertSendCoins()-1_0... successfull after revertCount=${revertCount}`)
                // treat revertingSendCoins as an error of the whole sendCoins-process
                const errmsg = `Error in writing sender pending transaction: ${JSON.stringify(err, null, 2)}`
                methodLogger.error(errmsg)
                throw new Error(errmsg)
              }
            } while (CONFIG.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
            const errmsg = `Error in reverting receiver pending transaction even after revertCount=${revertCount}` + JSON.stringify(err, null, 2)
            methodLogger.error(errmsg)
            throw new Error(errmsg)
          }
          methodLogger.debug('voteForSendCoins()-1_0... successfull')
          return voteResult
        } else {
          methodLogger.error(`break with error on writing pendingTransaction for recipient... ${voteResult}`)
        }
      } else {
        methodLogger.error(`break with no response from voteForSendCoins()-1_0...`)
      }
    }
  } catch (err: any) {  
    const errmsg = `Error: ${err.message}` + JSON.stringify(err, null, 2)
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  return null
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
