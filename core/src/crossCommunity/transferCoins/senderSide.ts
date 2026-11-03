import { randomInt } from 'node:crypto'
import {
  countOpenPendingTransactions,
  TransactionLink as DbTransactionLink,
  DbUser,
  dbFindAuthenticatedForeignCommunityByIdentifier,
  dbFindMemberAvatarTimestamp,
  dbInsertPendingTransaction,
} from 'database'
import { getLogger } from 'log4js'
import {
  CommandJwtPayloadType,
  encryptAndSign,
  GradidoUnit,
  PendingTransactionState,
  Result,
  UserPublicInfo,
} from 'shared'
import * as v from 'valibot'
import { CommandClientFactory, SendCoinsResult, V1_0_CommandClient } from '../../apis'
import { SendEmailCommand } from '../../command/commands/SendEmailCommand'
import { CONFIG as CONFIG_CORE } from '../../config'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendTransactionLinkRedeemedEmail } from '../../emails'
import { TransactionTypeId } from '../../graphql/enum/TransactionTypeId'
import { storeLinkAsRedeemed } from '../../graphql/logic/storeLinkAsRedeemed'
import { EncryptedTransferArgs } from '../../graphql/model/EncryptedTransferArgs'
import { calculateSenderBalance } from '../../logic'
import { ApiClient } from '../ApiClient'
import { ApiClientCache } from '../ApiClientCache'
import { CrossCommunityError, CrossCommunityErrorType, xcomError } from '../errorTypes'
import {
  CrossGroupTransaction,
  CrossGroupTransactionForeignUserInfo,
  crossGroupTransactionSchema,
  crossGroupTransactionWireSchema,
} from '../schema'
import { storeForeignUser } from '../storeForeignUser'
import { findPendingTransaction, mapToPendingTx, settlePendingTransaction } from './bothSides'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transferCoins.${method}`)

// TODO: move into resolver, show in frontend on return false, replace all places here with return false
const genericTransactionFailedMessage = 'Transaction failed!'

export async function run(
  senderUser: DbUser,
  recipientCommunityIdentifier: string,
  recipientIdentifier: string,
  amount: GradidoUnit,
  memo: string,
  transactionLink?: DbTransactionLink,
): Promise<boolean> {
  const logger = createLogger(`run`)
  // processing a x-community sendCoins
  logger.info('processing a x-community transaction...')
  if (!CONFIG_CORE.FEDERATION_XCOM_SENDCOINS_ENABLED) {
    logger.warn('X-Community sendCoins disabled per configuration!')
    throw new Error(genericTransactionFailedMessage)
  }
  const recipientCom = await dbFindAuthenticatedForeignCommunityByIdentifier(
    recipientCommunityIdentifier,
  )
  if (!recipientCom) {
    logger.warn(
      `to less or to many recipient community found for identifier: ${recipientCommunityIdentifier}`,
    )
    throw new Error(genericTransactionFailedMessage)
  }

  const balanceDate = new Date()
  if (transactionLink && transactionLink.validUntil < new Date()) {
    logger.warn(`TransactionLink ${transactionLink.id} is expired!`)
    throw new Error(`TransactionLink is expired!`)
  }

  try {
    const tx = v.parse(crossGroupTransactionSchema, {
      senderUser,
      recipientCommunityUuid: recipientCom.communityUuid,
      recipientIdentifier,
      balanceDate,
      amount,
      memo,
      transactionLinkId: transactionLink?.id,
    })
    const client = ApiClientCache.getInstance().get(
      recipientCom.url,
      recipientCom.publicKey,
      recipientCom.publicEncryptionKey,
    )
    const pendingResult = await processXComPendingSendCoins(client, tx, senderUser.id)
    if (!pendingResult.success) {
      logger.error(pendingResult)
      throw new Error(genericTransactionFailedMessage)
    }
    tx.senderUser.avatarUpdatedAt = await dbFindMemberAvatarTimestamp(senderUser.id)
    const committingResult = await processXComCommittingSendCoins(
      client,
      tx,
      pendingResult.value.recipientUser,
    )
    if (!committingResult.success) {
      logger.warn(
        `${recipientCommunityIdentifier} refused our transaction for ${recipientIdentifier}`,
      )
      throw new Error(genericTransactionFailedMessage)
    }
    // after successful x-com-tx store the recipient as foreign user
    const foreignUser = await storeForeignUser(pendingResult.value.recipientUser)

    if (transactionLink != null) {
      // after successful x-com-tx per link store the link as redeemed
      await storeLinkAsRedeemed(transactionLink, foreignUser!, balanceDate)
      await sendTransactionLinkRedeemedEmail({
        firstName: senderUser.firstName!,
        lastName: senderUser.lastName!,
        email: senderUser.emailContact.email,
        language: senderUser.language,
        senderAlias: committingResult.recipAlias,
        senderCommunity: recipientCom.name!,
        // The pair of whoever accepted, for the mail's button into the conversation with
        // them: the id the other server answered with, as the foreign user was just stored
        // under, and the uuid recipientCom was found by.
        senderUuid: committingResult.recipGradidoID,
        senderCommunityUuid: recipientCom.communityUuid,
        transactionAmount: amount,
        transactionMemo: memo,
      })
    }
  } catch (_err) {
    throw new Error(genericTransactionFailedMessage)
  }
  return true
}

// called on sender community site, will call prepareSendCoins on recipient community side and
// put sending pending transaction into db
async function processXComPendingSendCoins(
  client: ApiClient,
  txData: CrossGroupTransaction,
  userId: number,
): Promise<Result<CrossGroupTransactionForeignUserInfo, CrossCommunityError>> {
  const { senderUser: sender, recipientUser: recipient, balanceDate, amount } = txData
  // TODO: add timeout to be not blocked by started and never stopped cross group transactions
  if (
    (await countOpenPendingTransactions(
      [sender.gradidoId, recipient.identifier],
      PendingTransactionState.NEW,
    )) > 0
  ) {
    const m = `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`
    return xcomError(CrossCommunityErrorType.previousUserTxNotFinished, m)
  }

  // first calculate the sender balance and check if the transaction is allowed
  const senderBalance = await calculateSenderBalance(userId, amount.negated(), balanceDate)
  if (!senderBalance.success) {
    return xcomError(
      CrossCommunityErrorType.insufficientBalance,
      `User ${sender.id} has not enough GDD`,
    )
  }

  const { data: prepareResponse, error } = await client.prepareSendCoins(
    v.parse(crossGroupTransactionWireSchema, txData),
  )
  if (!prepareResponse) {
    const m = `prepare for send coins failed: ${JSON.stringify(error.value, null, 2)}`
    return xcomError(CrossCommunityErrorType.apiCallFailed, m)
  }

  // writing the pending transaction on receiver-side was successfull, so now write the sender side
  try {
    await dbInsertPendingTransaction(
      mapToPendingTx(
        txData,
        senderBalance.value,
        prepareResponse.recipientUser,
        userId,
        TransactionTypeId.SEND,
      ),
    )
  } catch (err) {
    // revert the existing pending transaction on receiver side
    let revertCount = 0
    do {
      if (await client.revertSendCoins(v.parse(crossGroupTransactionWireSchema, txData))) {
        const m = `Error in writing sender pending transaction: ${JSON.stringify(err, null, 2)}`
        return xcomError(CrossCommunityErrorType.insertPendingTxFailed, m)
      }
    } while (CONFIG_CORE.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
    const m =
      `Error in reverting receiver pending transaction even after revertCount=${revertCount}` +
      JSON.stringify(err, null, 2)
    return xcomError(CrossCommunityErrorType.foreignRevertSendCoinFailed, m)
  }
  return { success: true, value: prepareResponse }
}

async function processXComCommittingSendCoins(
  client: ApiClient,
  tx: CrossGroupTransaction,
  recipientUser: UserPublicInfo,
): Promise<Result<SendCoinsResult, CrossCommunityError>> {
  const logger = createLogger('senderCommit')
  try {
    // first find pending Tx with given parameters. Deliberately NOT by the name: the
    // alias is editable, so a member who renames between the pending and the committing
    // phase would leave this lookup empty - the send would neither settle nor revert and
    // the open-pending check would block them afterwards. The identifiers below already
    // determine the row; the stored `pendingTx.userName` is what the protocol then uses.
    const pendingTxResult = await findPendingTransaction(
      tx,
      recipientUser,
      TransactionTypeId.SEND,
      PendingTransactionState.NEW,
      logger,
    )
    if (!pendingTxResult.success) {
      return pendingTxResult
    }

    // The sender's picture date travels with the settle, not with the vote: the recipient's
    // server stores the booking and the sender's mirror row when it settles. Null when the
    // sender has nothing members may see; memberAvatarDateForTransfer answers null for a
    // failed read as well.
    const acknowledge = await client.settleSendCoins(tx)
    if (!acknowledge.error) {
      // settle the pending transaction on receiver-side was successfull, so now settle the sender side
      try {
        const settleResult = await settlePendingTransaction(pendingTxResult.value)
        if (!settleResult.success) {
          // revert the existing pending transaction on receiver side
          let revertCount = 0
          do {
            if (await client.revertSettledSendCoins(tx)) {
              // treat revertingSettledSendCoins as an error of the whole sendCoins-process
              return settleResult
            }
          } while (CONFIG_CORE.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS > revertCount++)
          const m = `Error in reverting receiver pending transaction even after revertCount=${revertCount}`
          return xcomError(CrossCommunityErrorType.foreignRevertSettledSendCoinFailed, m)
        }

        // ** after successfull settle of the pending transaction on sender side we have to send a trigger to the recipient community to send an email to the x-com-tx recipient
        const cmdClient = CommandClientFactory.getInstance(receiverFCom)
        const handshakeID = randomInt(2 ** 32).toString()
        if (cmdClient instanceof V1_0_CommandClient) {
          const payload = new CommandJwtPayloadType(
            handshakeID,
            SendEmailCommand.SEND_MAIL_COMMAND,
            SendEmailCommand.name,
            [
              JSON.stringify({
                mailType: 'sendTransactionReceivedEmail',
                senderComUuid: tx.senderUser.communityUuid,
                senderGradidoId: tx.senderUser.gradidoId,
                receiverComUuid: recipientUser.communityUuid,
                receiverGradidoId: recipientUser.gradidoId,
                memo: tx.memo,
                amount: tx.amount,
              }),
            ],
          )
          const jws = await encryptAndSign(
            payload,
            senderCom.privateJwtKey!,
            receiverCom.publicJwtKey!,
          )
          const args = new EncryptedTransferArgs()
          args.publicKey = senderCom.publicKey.toString('hex')
          args.jwt = jws
          args.handshakeID = handshakeID
          const result = await cmdClient.sendCommand(args)
          if (typeof result === 'string') {
            const errmsg = 'Failed to send command with error: ' + result
            methodLogger.error(errmsg)
            throw new Error(errmsg)
          }
        }
      } catch (err) {}
    }
  } catch (err) {
    methodLogger.error(`Error: ${JSON.stringify(err, null, 2)}`)
    sendCoinsResult.vote = false
  }
  return sendCoinsResult
}
