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
  GradidoUnit,
  PendingTransactionState,
  RECIPIENT_NOT_FOUND,
  Result,
  UserPublicInfo,
  userPublicInfoSchema,
} from 'shared'
import { MonotonicTimer } from 'shared-native'
import * as v from 'valibot'
import { CONFIG as CONFIG_CORE } from '../../config'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendTransactionLinkRedeemedEmail } from '../../emails'
import { TransactionTypeId } from '../../graphql/enum/TransactionTypeId'
import { calculateSenderBalance, storeForeignUser } from '../../logic'
import { storeLinkAsRedeemed } from '../../logic/transactionLink.logic'
import { ApiClient } from '../ApiClient'
import { ApiClientCache } from '../ApiClientCache'
import { CrossCommunityError, CrossCommunityErrorType, xcomError } from '../errorTypes'
import {
  CrossGroupTransaction,
  crossGroupTransactionSchema,
  crossGroupTransactionWireSchema,
} from '../schema'
import { findPendingTransaction, mapToPendingTx, settlePendingTransaction } from './bothSides'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transferCoins.${method}`)

// TODO: move into resolver, show in frontend on return false, replace all places here with return false
const genericTransactionFailedMessage = 'Transaction failed!'

export async function processXComCompleteTransaction(
  sender: DbUser,
  recipientCommunityIdentifier: string,
  recipientIdentifier: string,
  amount: GradidoUnit,
  memo: string,
  transactionLink?: DbTransactionLink,
): Promise<boolean> {
  const timer = new MonotonicTimer()
  const logger = createLogger(`processXComCompleteTransaction`)
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
      sender,
      recipient: { communityUuid: recipientCom.communityUuid, identifier: recipientIdentifier },
      balanceDate,
      amount,
      memo,
      transactionLinkId: transactionLink?.id,
    })
    const client = ApiClientCache.getInstance().get(recipientCom)
    const pendingResult = await processXComPendingSendCoins(client, tx, sender.id)
    if (!pendingResult.success) {
      logger.warn(pendingResult.error.message)
      // the other community has no such member: the wallet's sentence, as for a member of this one
      if (pendingResult.error.type === CrossCommunityErrorType.notFound) {
        throw new Error(`${RECIPIENT_NOT_FOUND}: ${recipientIdentifier}`)
      }
      throw new Error(genericTransactionFailedMessage)
    }
    const foreignUser = pendingResult.value
    tx.sender.avatarUpdatedAt = await dbFindMemberAvatarTimestamp(sender.id)
    const committingResult = await processXComCommittingSendCoins(client, tx, foreignUser)
    if (!committingResult.success) {
      if (committingResult.error.type === CrossCommunityErrorType.notFound) {
        logger.error(committingResult.error.message)
      } else {
        logger.warn(
          `${recipientCommunityIdentifier} refused our transaction for ${recipientIdentifier} because: ${committingResult.error.message}`,
        )
      }
      throw new Error(genericTransactionFailedMessage)
    }
    // after successful x-com-tx store the recipient as foreign user
    const foreignUserStoreResult = await storeForeignUser(foreignUser)

    if (transactionLink != null) {
      // after successful x-com-tx per link store the link as redeemed
      if (foreignUserStoreResult.success) {
        await storeLinkAsRedeemed(transactionLink, foreignUserStoreResult.value, balanceDate)
      } else {
        const m = `couldn't mark transaction link: ${transactionLink.id} as redeemed because of missing foreign user id`
        logger.error(m)
      }
      await sendTransactionLinkRedeemedEmail({
        firstName: sender.firstName!,
        lastName: sender.lastName!,
        email: sender.emailContact.email,
        language: sender.language,
        senderAlias: foreignUser.alias,
        senderCommunity: recipientCom.name!,
        // The pair of whoever accepted, for the mail's button into the conversation with
        // them: the id the other server answered with, as the foreign user was just stored
        // under, and the uuid recipientCom was found by.
        senderUuid: foreignUser.gradidoId,
        senderCommunityUuid: recipientCom.communityUuid,
        transactionAmount: amount,
        transactionMemo: memo,
      })
    }
    logger.info(`tx id: ${committingResult.value} finished after ${timer}`)
  } catch (err) {
    // the sentence above goes out as decided; anything else is a crash, and the wallet hears no detail of it
    if (err instanceof Error && err.message.startsWith(RECIPIENT_NOT_FOUND)) {
      throw err
    }
    logger.error(`unexcpected error:`, err)
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
): Promise<Result<UserPublicInfo, CrossCommunityError>> {
  const { sender, recipient, balanceDate, amount } = txData
  // TODO: add timeout to be not blocked by started and never stopped cross group transactions
  if (
    (await countOpenPendingTransactions(
      [sender.gradidoId, recipient.identifier],
      PendingTransactionState.NEW,
    )) > 0
  ) {
    const e = `There exist still ongoing 'Pending-Transactions' for the involved users on sender-side!`
    return xcomError(CrossCommunityErrorType.previousUserTxNotFinished, e)
  }

  // first calculate the sender balance and check if the transaction is allowed
  const senderBalance = await calculateSenderBalance(userId, amount, balanceDate)
  if (!senderBalance.success) {
    return xcomError(
      CrossCommunityErrorType.insufficientBalance,
      `User ${userId} has not enough GDD`,
    )
  }

  const { data, error } = await client.prepareSendCoins(
    v.parse(crossGroupTransactionWireSchema, txData),
  )
  if (error) {
    if (error.status === 404) {
      const m = `${txData.recipient.communityUuid} has no member ${txData.recipient.identifier}`
      return xcomError(CrossCommunityErrorType.notFound, m)
    }
    const m = `prepare for send coins failed: ${JSON.stringify(error.value, null, 2)}`
    return xcomError(CrossCommunityErrorType.apiCallFailed, m)
  }

  // the answer of another server: taken only as far as it is the recipient's public info
  const parsedUserInfo = v.safeParse(userPublicInfoSchema, data)
  if (!parsedUserInfo.success) {
    const m = `prepare for send coins answered with wrong type: ${JSON.stringify(data, null, 2)}`
    return xcomError(CrossCommunityErrorType.apiCallFailed, m)
  }
  const recipientUser = parsedUserInfo.output
  if (recipientUser.communityUuid !== client.communityUuid) {
    const m = `recipient user community uuid: ${recipientUser.communityUuid} and recipient community uuid: ${client.communityUuid} not match`
    return xcomError(CrossCommunityErrorType.unknown, m)
  }
  // writing the pending transaction on receiver-side was successfull, so now write the sender side
  try {
    const insertResult = await dbInsertPendingTransaction(
      mapToPendingTx(txData, senderBalance.value, recipientUser, userId, TransactionTypeId.SEND),
    )
    if (!insertResult.success) {
      throw insertResult
    }
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
  return { success: true, value: recipientUser }
}

async function processXComCommittingSendCoins(
  client: ApiClient,
  tx: CrossGroupTransaction,
  recipientUser: UserPublicInfo,
): Promise<Result<number, CrossCommunityError>> {
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
      const foreignEmailResult = await client.emailTransactionReceived(tx)
      if (foreignEmailResult.status !== 200) {
        const m = 'Failed to send command with error: ' + foreignEmailResult.error
        return xcomError(CrossCommunityErrorType.apiCallFailed, m)
      }
      return settleResult
    }
    const m = `settleSendCoins call failed with error: ${JSON.stringify(acknowledge.error)}`
    return xcomError(CrossCommunityErrorType.apiCallFailed, m)
  } catch (err) {
    return xcomError(CrossCommunityErrorType.unknown, `Error: ${JSON.stringify(err, null, 2)}`)
  }
}
