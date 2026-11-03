import {
  countOpenPendingTransactions,
  dbFindPendingTransaction,
  dbFindUserByIdentifier,
  dbInsertPendingTransaction,
  dbRemovePendingTransaction,
  getHomeCommunityDrizzle,
  TransactionTypeId,
  UserSelect,
} from 'database'
import { getLogger } from 'log4js'
import { PendingTransactionState, Result, Uuidv4, VoidResult } from 'shared'
import { memberAvatarDateForTransfer } from '../../apis'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { calculateRecipientBalance } from '../../logic'
import { CrossCommunityError, CrossCommunityErrorType, xcomError } from '../errorTypes'
import { CrossGroupTransaction, CrossGroupTransactionForeignUserInfoInput } from '../schema'
import { storeForeignUser } from '../storeForeignUser'
import {
  mapToPendingTx,
  mapTxToLog,
  revertSettledTransaction,
  settlePendingTransaction,
} from './bothSides'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transferCoins.${method}`)

// check if tx came from correct community and if recipient user exist and if, return it
async function auth(
  tx: CrossGroupTransaction,
  senderCommunityUuid: Uuidv4, // actual community uuid from sender, verified by signature)
): Promise<Result<UserSelect, CrossCommunityError>> {
  // first, check if we are in fact the correct recipient community
  const homeCom = await getHomeCommunityDrizzle()
  if (homeCom.communityUuid !== tx.recipientUser.communityUuid) {
    const e = `We got a cross transaction for another community: ${tx.recipientUser.communityUuid}`
    return xcomError(CrossCommunityErrorType.authFailed, e)
  }
  // and the sender is the correct sender community
  if (senderCommunityUuid !== tx.senderUser.communityUuid) {
    const e = `We got a cross transaction from a wrong community: expected: ${tx.senderUser.communityUuid}, actual: ${senderCommunityUuid}`
    return xcomError(CrossCommunityErrorType.authFailed, e)
  }

  // second check if receiver user exists in this community
  const recipientUser = await dbFindUserByIdentifier(
    tx.recipientUser.identifier,
    tx.recipientUser.communityUuid,
  )
  if (!recipientUser) {
    const e = `User with identifier ${tx.recipientUser.identifier} not found`
    return xcomError(CrossCommunityErrorType.notFound, e)
  }
  return { success: true, value: recipientUser }
}

export async function prepareSendCoins(
  tx: CrossGroupTransaction,
  senderCommunityUuid: Uuidv4, // actual community uuid from sender, verified by signature
): Promise<Result<CrossGroupTransactionForeignUserInfoInput, CrossCommunityError>> {
  try {
    const authResult = await auth(tx, senderCommunityUuid)
    if (!authResult.success) {
      return authResult
    }
    const recipientUser = authResult.value

    if (
      (await countOpenPendingTransactions(
        [tx.senderUser.gradidoId, recipientUser.gradidoId],
        PendingTransactionState.NEW,
      )) > 0
    ) {
      const m = `There exist still ongoing 'Pending-Transactions' for the involved users on receiver-side!`
      return xcomError(CrossCommunityErrorType.previousUserTxNotFinished, m)
    }

    const [receiveBalance, recipientAvatarUpdatedAt] = await Promise.all([
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
    return {
      success: true,
      value: {
        recipientUser,
        recipientAvatarUpdatedAt,
      },
    }
  } catch (err) {
    createLogger(`voteForSendCoins`).error(`Error in voteForSendCoins: `, err)
    return xcomError(CrossCommunityErrorType.unknown, 'Something went wrong')
  }
}

export async function revertSendCoins(
  tx: CrossGroupTransaction,
  senderCommunityUuid: Uuidv4, // actual community uuid from sender, verified by signature
): Promise<VoidResult<CrossCommunityError>> {
  const logger = createLogger(`revertSendCoins`)

  const authResult = await auth(tx, senderCommunityUuid)
  if (!authResult.success) {
    return authResult
  }
  const recipientUser = authResult.value

  const affectedRows = await dbRemovePendingTransaction(
    recipientUser,
    tx.senderUser,
    TransactionTypeId.RECEIVE,
    PendingTransactionState.NEW,
    tx.balanceDate,
    tx.memo,
  )

  if (affectedRows !== 1) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx for removal with:`, mapTxToLog(tx))
    }
    const e = `missing pending transaction for revert on recipient side`
    return xcomError(CrossCommunityErrorType.notFound, e)
  }
  return { success: true }
}

export async function settleSendCoins(
  tx: CrossGroupTransaction,
  senderCommunityUuid: Uuidv4, // actual community uuid from sender, verified by signature
): Promise<VoidResult<CrossCommunityError>> {
  const logger = createLogger(`recipientSettle`)

  const authResult = await auth(tx, senderCommunityUuid)
  if (!authResult.success) {
    return authResult
  }
  const recipientUser = authResult.value
  const pendingTx = await dbFindPendingTransaction(
    recipientUser,
    tx.senderUser,
    TransactionTypeId.RECEIVE,
    PendingTransactionState.NEW,
    tx.balanceDate,
    tx.memo,
  )

  if (!pendingTx || !pendingTx.amount || tx.amount.comparedTo(pendingTx.amount) !== 0n) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx with:`, mapTxToLog(tx))
    }
    const e = `missing pending transaction for commit on recipient side`
    return xcomError(CrossCommunityErrorType.notFound, e)
  }

  const result = await settlePendingTransaction(pendingTx)
  if (!result.success) {
    return result
  }
  // after successful x-com-tx store the recipient as foreign user
  await storeForeignUser(tx.senderUser)

  return { success: true }
}

export async function revertSettledSendCoins(
  tx: CrossGroupTransaction,
  senderCommunityUuid: Uuidv4, // actual community uuid from sender, verified by signature
): Promise<VoidResult<CrossCommunityError>> {
  const logger = createLogger(`revertRecipientSettledSendCoins`)

  const authResult = await auth(tx, senderCommunityUuid)
  if (!authResult.success) {
    return authResult
  }
  const recipientUser = authResult.value

  const pendingTx = await dbFindPendingTransaction(
    recipientUser,
    tx.senderUser,
    TransactionTypeId.RECEIVE,
    PendingTransactionState.SETTLED,
    tx.balanceDate,
    tx.memo,
  )

  if (!pendingTx || !pendingTx.amount || tx.amount.comparedTo(pendingTx.amount) !== 0n) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx with:`, mapTxToLog(tx))
    }
    const e = `missing pending transaction for revert on recipient side`
    return xcomError(CrossCommunityErrorType.notFound, e)
  }

  return await revertSettledTransaction(pendingTx)
}
