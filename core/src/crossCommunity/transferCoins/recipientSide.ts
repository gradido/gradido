import {
  countOpenPendingTransactions,
  dbFindPendingTransaction,
  dbFindUserByIdentifier,
  dbFindUserContact,
  dbInsertPendingTransaction,
  dbRemovePendingTransaction,
  getHomeCommunityDrizzle,
  TransactionTypeId,
  UserSelect,
} from 'database'
import { status } from 'elysia'
import { getLogger } from 'log4js'
import { PendingTransactionState } from 'shared'
import * as v from 'valibot'
import { memberAvatarDateForTransfer } from '../../apis'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendTransactionReceivedEmail } from '../../emails'
import { calculateRecipientBalance, storeForeignUser } from '../../logic'
import { ApiClientCompleted } from '../ApiClient'
import {
  CrossGroupTransaction,
  CrossGroupTransactionWire,
  crossGroupTransactionSchema,
  userPublicInfoWireSchema,
} from '../schema'
import {
  mapToPendingTx,
  mapTxToLog,
  revertSettledTransaction,
  settlePendingTransaction,
} from './bothSides'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transferCoins.${method}`)

// check if tx came from correct community and if recipient user exist and if, return it
export async function auth(context: {
  body: CrossGroupTransactionWire
  senderClient: ApiClientCompleted // actual community uuid from sender, verified by signature)
}) {
  const tx = context.body
  // first, check if we are in fact the correct recipient community
  const homeCom = await getHomeCommunityDrizzle()
  if (homeCom.communityUuid !== tx.recipient.communityUuid) {
    const m = `We got a cross transaction for another community: ${tx.recipient.communityUuid}`
    createLogger('auth').debug(m)
    return status('Unauthorized')
  }
  // and the sender is the correct sender community
  if (context.senderClient.communityUuid !== tx.sender.communityUuid) {
    const m = `We got a cross transaction from a wrong community: expected: ${tx.sender.communityUuid}, actual: ${context.senderClient.communityUuid}`
    createLogger('auth').debug(m)
    return status('Unauthorized')
  }

  // second check if receiver user exists in this community
  const recipientUser = await dbFindUserByIdentifier(
    tx.recipient.identifier,
    tx.recipient.communityUuid,
  )
  if (!recipientUser) {
    createLogger('auth').debug(`User with identifier ${tx.recipient.identifier} not found`)
    return status('Not Found')
  }
  return { recipientUser, tx: v.parse(crossGroupTransactionSchema, tx) }
}

export async function prepareSendCoins({
  tx,
  recipientUser,
}: {
  tx: CrossGroupTransaction
  recipientUser: UserSelect
}) {
  const logger = createLogger('prepareSendCoins')
  try {
    if (
      (await countOpenPendingTransactions(
        [tx.sender.gradidoId, recipientUser.gradidoId],
        PendingTransactionState.NEW,
      )) > 0
    ) {
      const m = `There exist still ongoing 'Pending-Transactions' for the involved users on receiver-side!`
      logger.warn(m)
      return status('Service Unavailable')
    }

    const [receiveBalance, avatarUpdatedAt] = await Promise.all([
      calculateRecipientBalance(recipientUser.id, tx.amount, tx.balanceDate),
      // The recipient's picture date for the sender's lists, read before the pending
      // transaction is written. Null when the recipient has nothing members may see;
      // memberAvatarDateForTransfer answers null for a failed read as well.
      memberAvatarDateForTransfer(recipientUser.id),
    ])

    const pendingTx = mapToPendingTx(
      tx,
      receiveBalance,
      recipientUser,
      recipientUser.id,
      TransactionTypeId.RECEIVE,
    )
    await dbInsertPendingTransaction(pendingTx)
    // only what the sender's side needs of the recipient: the public info, nothing else of the row
    return v.parse(userPublicInfoWireSchema, { ...recipientUser, avatarUpdatedAt })
  } catch (err) {
    logger.error(`Error in voteForSendCoins: `, err)
    return status('Internal Server Error')
  }
}

export async function revertSendCoins({
  tx,
  recipientUser,
}: {
  tx: CrossGroupTransaction
  recipientUser: UserSelect
}) {
  const logger = createLogger(`revertSendCoins`)
  const affectedRows = await dbRemovePendingTransaction(
    recipientUser,
    tx.sender,
    TransactionTypeId.RECEIVE,
    PendingTransactionState.NEW,
    tx.balanceDate,
    tx.memo,
  )

  if (affectedRows !== 1) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx for removal with:`, mapTxToLog(tx))
    }
    // TODO: add tx id
    const m = `missing pending transaction for revert on recipient side`
    logger.warn(m)
    return status('Not Found')
  }
  return status('OK')
}

export async function settleSendCoins({
  tx,
  recipientUser,
}: {
  tx: CrossGroupTransaction
  recipientUser: UserSelect
}) {
  const logger = createLogger(`recipientSettle`)
  const pendingTx = await dbFindPendingTransaction(
    recipientUser,
    tx.sender,
    TransactionTypeId.RECEIVE,
    PendingTransactionState.NEW,
    tx.balanceDate,
    tx.memo,
  )

  if (!pendingTx || !pendingTx.amount || tx.amount.comparedTo(pendingTx.amount) !== 0n) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx with:`, mapTxToLog(tx))
    }
    // TODO: add tx id
    const m = `missing pending transaction for commit on recipient side`
    logger.warn(m)
    return status('Not Found')
  }

  const result = await settlePendingTransaction(pendingTx, recipientUser.transfersInChat === false)
  if (!result.success) {
    logger.warn(result.error.message)
    return status('Internal Server Error')
  }
  // after successful x-com-tx store the recipient as foreign user
  await storeForeignUser(tx.sender)

  return status('OK')
}

export async function revertSettledSendCoins({
  tx,
  recipientUser,
}: {
  tx: CrossGroupTransaction
  recipientUser: UserSelect
}) {
  const logger = createLogger(`revertRecipientSettledSendCoins`)
  const pendingTx = await dbFindPendingTransaction(
    recipientUser,
    tx.sender,
    TransactionTypeId.RECEIVE,
    PendingTransactionState.SETTLED,
    tx.balanceDate,
    tx.memo,
  )

  if (!pendingTx || !pendingTx.amount || tx.amount.comparedTo(pendingTx.amount) !== 0n) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx with:`, mapTxToLog(tx))
    }
    logger.warn(`missing pending transaction for revert on recipient side`)
    return status('Not Found')
  }

  const revertResult = await revertSettledTransaction(pendingTx)
  if (!revertResult.success) {
    logger.error(`revert failed`, revertResult.error)
    return status('Internal Server Error')
  }
  return status('OK')
}

export async function emailTransactionReceived(context: {
  tx: CrossGroupTransaction
  recipientUser: UserSelect
}) {
  const logger = createLogger('emailTransactionReceived')
  const { tx, recipientUser } = context
  if (recipientUser.transfersInChat !== false && recipientUser.emailId) {
    const userContact = await dbFindUserContact(recipientUser.emailId)
    if (!userContact) {
      logger.error(`missing user contact for user ${recipientUser.emailId}`)
      return status('Not Found')
    }
    // TODO: add check for pending tx with state settled with this transaction data
    const emailSendResult = await sendTransactionReceivedEmail({
      ...recipientUser,
      senderAlias: tx.sender.alias, // change parmater structure in sendTransactionReceivedEmail
      firstName: recipientUser.firstName ?? '', // TODO: change to Not NULL
      lastName: recipientUser.lastName ?? '', // TODO: change to Not NULL
      email: userContact?.email,
      memo: tx.memo,
      transactionAmount: tx.amount, // change parmater structure in sendTransactionReceivedEmail
    })
    const e = `Transaction Received Email couldn't be sended to user: ${recipientUser.id}`
    if (typeof emailSendResult !== 'object') {
      if (logger.isDebugEnabled()) {
        logger.debug(e, JSON.stringify(emailSendResult, null, 2))
      } else {
        logger.warn(e)
      }
      return status('Service Unavailable')
    }
  }
  // TODO: extend pending transaction state by email_sended, or finished.. or..  to prevent double send email
  return status('OK')
}
