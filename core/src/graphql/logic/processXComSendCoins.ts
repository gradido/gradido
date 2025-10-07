import {
  CommunityLoggingView,
  countOpenPendingTransactions,
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  PendingTransaction as DbPendingTransaction,
  TransactionLink as DbTransactionLink,
  User as dbUser,
  findTransactionLinkByCode,
  findUserByIdentifier,
  getCommunityByUuid,
  PendingTransactionLoggingView,
  UserLoggingView
} from 'database'
import { Decimal } from 'decimal.js-light'

import { CONFIG as CONFIG_CORE } from '../../config'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'

import { encryptAndSign, PendingTransactionState, SendCoinsJwtPayloadType, SendCoinsResponseJwtPayloadType, verifyAndDecrypt } from 'shared'
import { SendCoinsClient as V1_0_SendCoinsClient } from '../../federation/client/1_0/SendCoinsClient'
import { SendCoinsResult } from '../../federation/client/1_0/model/SendCoinsResult'
import { SendCoinsClientFactory } from '../../federation/client/SendCoinsClientFactory'
import { TransactionTypeId } from '../../graphql/enum/TransactionTypeId'
// import { LogError } from '@server/LogError'
import { getLogger } from 'log4js'
import { calculateSenderBalance } from '../../util/calculateSenderBalance'
import { fullName } from '../../util/utilities'

import { randombytes_random } from 'sodium-native'
import { SendCoinsResultLoggingView } from '../../federation/client/1_0/logging/SendCoinsResultLogging.view'
import { EncryptedTransferArgs } from '../../graphql/model/EncryptedTransferArgs'
import { settlePendingSenderTransaction } from './settlePendingSenderTransaction'
import { storeForeignUser } from './storeForeignUser'
import { storeLinkAsRedeemed } from './storeLinkAsRedeemed'

const createLogger = (method: string) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.processXComSendCoins.${method}`)

export async function processXComCompleteTransaction(
  senderCommunityUuid: string,
  senderGradidoId: string,
  recipientCommunityUuid: string,
  recipientGradidoId: string,
  amount: string,
  memo: string,
  code?: string,
  recipientFirstName?: string,
  recipientAlias?: string,
  creationDate?: Date,
): Promise<boolean> {
  const methodLogger = createLogger(`processXComCompleteTransaction`)
  // processing a x-community sendCoins
  methodLogger.info('processing a x-community transaction...')
  if (!CONFIG_CORE.FEDERATION_XCOM_SENDCOINS_ENABLED) {
    const errmsg = 'X-Community sendCoins disabled per configuration!'
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  const senderCom = await getCommunityByUuid(senderCommunityUuid)
  methodLogger.debug('sender community: ', senderCom?.id)
  if (senderCom === null) {
    const errmsg = `no sender community found for identifier: ${senderCommunityUuid}`
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  const senderUser = await findUserByIdentifier(senderGradidoId, senderCommunityUuid)
  if (senderUser === null) {
    const errmsg = `no sender user found for identifier: ${senderCommunityUuid}:${senderGradidoId}`
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  const recipientCom = await getCommunityByUuid(recipientCommunityUuid)
  methodLogger.debug('recipient community: ', recipientCom?.id)
  if (recipientCom === null) {
    const errmsg = `no recipient community found for identifier: ${recipientCommunityUuid}`
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  if (recipientCom !== null && recipientCom.authenticatedAt === null) {
    const errmsg = 'recipient community is connected, but still not authenticated yet!'
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  let dbTransactionLink: DbTransactionLink | null = null
  if(code !== undefined) {
    try {
      dbTransactionLink = await findTransactionLinkByCode(code)
      if (dbTransactionLink && dbTransactionLink.validUntil < new Date()) {
        const errmsg = `TransactionLink ${code} is expired!`
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
    } catch (_err) {
      const errmsg = `TransactionLink ${code} not found any more!`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
  }
  if(creationDate === undefined) {
    creationDate = new Date()
  }
  let pendingResult: SendCoinsResponseJwtPayloadType | null = null
  let committingResult: SendCoinsResult
  
  try {
    pendingResult = await processXComPendingSendCoins(
      recipientCom,
      senderCom,
      creationDate,
      new Decimal(amount),
      memo,
      senderUser,
      recipientGradidoId,
      dbTransactionLink?.id,
    )
    methodLogger.debug('processXComPendingSendCoins result: ', pendingResult)
    if (pendingResult && pendingResult.vote && pendingResult.recipGradidoID) {
      methodLogger.debug('vor processXComCommittingSendCoins... ')
      committingResult = await processXComCommittingSendCoins(
        recipientCom,
        senderCom,
        creationDate,
        new Decimal(amount),
        memo,
        senderUser,
        pendingResult,
        dbTransactionLink?.id,
      )
      methodLogger.debug('processXComCommittingSendCoins result: ', committingResult)
      if (!committingResult.vote) {
        methodLogger.fatal('FATAL ERROR: on processXComCommittingSendCoins for', committingResult)
        throw new Error(
          'FATAL ERROR: on processXComCommittingSendCoins with ' +
          recipientCom.communityUuid +
          recipientGradidoId +
          amount.toString() +
          memo,
        )
      }
      // after successful x-com-tx store the recipient as foreign user
      methodLogger.debug('store recipient as foreign user...')
      const foreignUser = await storeForeignUser(recipientCom, committingResult)
      if (foreignUser) {
        methodLogger.info(
          'X-Com: new foreign user inserted successfully...',
          recipientCom.communityUuid,
          committingResult.recipGradidoID,
        )
      } else {
        const errmsg = `X-Com: Error storing foreign user for ${recipientCom.communityUuid} ${committingResult.recipGradidoID}`
        methodLogger.error(errmsg)
        throw new Error(errmsg)
      }
      if(dbTransactionLink !== null) {
        // after successful x-com-tx per link store the link as redeemed
        methodLogger.debug('store link as redeemed...')
        if (await storeLinkAsRedeemed(dbTransactionLink, foreignUser!, creationDate)) {
          methodLogger.info(
            'X-Com: store link as redeemed successfully...',
            dbTransactionLink.code,
            foreignUser!.id,
            creationDate,
          )
        }
      }
    } 
  } catch (err) {
    const errmsg = `ERROR: on processXComCommittingSendCoins with ` +
      recipientCommunityUuid +
      recipientGradidoId +
      amount.toString() +
      memo +
      err
    methodLogger.error(errmsg)
    throw new Error(errmsg)
  }
  return true
}

export async function processXComPendingSendCoins(
  receiverCom: DbCommunity,
  senderCom: DbCommunity,
  creationDate: Date,
  amount: Decimal,
  memo: string,
  sender: dbUser,
  recipientIdentifier: string,
  transactionLinkId?: number,
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
          recipientIdentifier,
          transactionLinkId
        }
      )
    }
    if (await countOpenPendingTransactions([sender.gradidoID, recipientIdentifier]) > 0) {
      const errmsg = `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    const handshakeID = randombytes_random().toString()
    methodLogger.addContext('handshakeID', handshakeID)
    // first calculate the sender balance and check if the transaction is allowed
    const senderBalance = await calculateSenderBalance(sender.id, amount.mul(-1), creationDate)
    if (!senderBalance) {
      const errmsg = `User has not enough GDD or amount is < 0`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(`calculated senderBalance = ${JSON.stringify(senderBalance, null, 2)}`)
    }

    const receiverFCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        publicKey: Buffer.from(receiverCom.publicKey),
        apiVersion: CONFIG_CORE.FEDERATION_BACKEND_SEND_ON_API,
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
        sender.alias,
        transactionLinkId
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
            pendingTx.transactionLinkId = transactionLinkId
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
            } while (CONFIG_CORE.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
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
  transactionLinkId?: number,
): Promise<SendCoinsResult> {
  const methodLogger = createLogger(`processXComCommittingSendCoins`)
  const handshakeID = randombytes_random().toString()
  methodLogger.addContext('handshakeID', handshakeID)
  const sendCoinsResult = new SendCoinsResult()
  try {
    if(methodLogger.isDebugEnabled()) {
      methodLogger.debug(
        'XCom: processXComCommittingSendCoins...', {
          receiverCom: new CommunityLoggingView(receiverCom),
          senderCom: new CommunityLoggingView(senderCom),
          creationDate: creationDate.toISOString(),
          amount: amount.toString(),
          memo: memo.substring(0, 5),
          sender: new UserLoggingView(sender),
          recipient: new SendCoinsResultLoggingView(recipient),
          transactionLinkId,
        }
      )
    }
    // first find pending Tx with given parameters
    const pendingTx = await DbPendingTransaction.findOneBy({
      userCommunityUuid: senderCom.communityUuid ?? 'homeCom-UUID',
      userGradidoID: sender.gradidoID,
      userName: fullName(sender.firstName, sender.lastName),
      linkedUserCommunityUuid:
        receiverCom.communityUuid ?? CONFIG_CORE.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID,
      linkedUserGradidoID: recipient.recipGradidoID ? recipient.recipGradidoID : undefined,
      typeId: TransactionTypeId.SEND,
      state: PendingTransactionState.NEW,
      balanceDate: creationDate,
      memo,
    })
    if (pendingTx) {
      if(methodLogger.isDebugEnabled()) {
        methodLogger.debug(`find pending Tx for settlement: ${new PendingTransactionLoggingView(pendingTx)}`)
      }
      const receiverFCom = await DbFederatedCommunity.findOneOrFail({
        where: {
          publicKey: Buffer.from(receiverCom.publicKey),
          apiVersion: CONFIG_CORE.FEDERATION_BACKEND_SEND_ON_API,
        },
      })
      const client = SendCoinsClientFactory.getInstance(receiverFCom)

      if (client instanceof V1_0_SendCoinsClient) {
        const payload = new SendCoinsJwtPayloadType(
          handshakeID,
          pendingTx.linkedUserCommunityUuid
            ? pendingTx.linkedUserCommunityUuid
            : CONFIG_CORE.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID,
          pendingTx.linkedUserGradidoID!,
          pendingTx.balanceDate.toISOString(),
          pendingTx.amount.mul(-1),
          pendingTx.memo,
          pendingTx.userCommunityUuid,
          pendingTx.userGradidoID!,
          pendingTx.userName!,
          sender.alias,
          pendingTx.transactionLinkId,
        )
        payload.recipientCommunityUuid = pendingTx.linkedUserCommunityUuid
          ? pendingTx.linkedUserCommunityUuid
          : CONFIG_CORE.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID
        if (pendingTx.linkedUserGradidoID) {
          payload.recipientUserIdentifier = pendingTx.linkedUserGradidoID
        }
        if(methodLogger.isDebugEnabled()) {
          methodLogger.debug(`ready for settleSendCoins with payload=${ JSON.stringify(payload)}`)
        }
        const jws = await encryptAndSign(payload, senderCom.privateJwtKey!, receiverCom.publicJwtKey!)
        // prepare the args for the client invocation
        const args = new EncryptedTransferArgs()
        args.publicKey = senderCom.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = handshakeID
        const acknowledge = await client.settleSendCoins(args)
        methodLogger.debug(`return from settleSendCoins: ${acknowledge}`)
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
            methodLogger.error(`Error in writing sender pending transaction: ${JSON.stringify(err, null, 2)}`)
            // revert the existing pending transaction on receiver side
            let revertCount = 0
            methodLogger.debug('first try to revertSettledSendCoins of receiver')
            do {
              if (await client.revertSettledSendCoins(args)) {
                methodLogger.debug(
                  `revertSettledSendCoins()-1_0... successfull after revertCount=${revertCount}`,
                )
                // treat revertingSettledSendCoins as an error of the whole sendCoins-process
                const errmsg = `Error in settle sender pending transaction: ${JSON.stringify(err, null, 2)}`
                methodLogger.error(errmsg)
                throw new Error(errmsg)
              }
            } while (CONFIG_CORE.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
            const errmsg = `Error in reverting receiver pending transaction even after revertCount=${revertCount}`
            methodLogger.error(errmsg)
            throw new Error(errmsg)
          }
        }
      }
    }
  } catch (err) {
    methodLogger.error(`Error: ${JSON.stringify(err, null, 2)}`)
    sendCoinsResult.vote = false
  }
  return sendCoinsResult
}
