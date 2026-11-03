import {
  AppDatabase,
  countOpenPendingTransactions,
  dbFindPendingTransaction,
  dbGetLastTransactionForUser,
  dbGetLastTransactionId,
  dbInsertTransaction,
  dbRemoveTransaction,
  dbUpdatePendingTransactionState,
  drizzleDb,
  PendingTransactionInsert,
  PendingTransactionSelect,
  TransactionSelect,
  TransactionTypeId,
} from 'database'
import { Logger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import {
  DecayCalculationType,
  PendingTransactionState,
  Result,
  UserPublicInfo,
  VoidResult,
} from 'shared'
import { UserBalance } from '../../logic'
import { CrossCommunityError, CrossCommunityErrorType, xcomError } from '../errorTypes'
import { CrossGroupTransaction } from '../schema'

export function mapToPendingTx(
  tx: CrossGroupTransaction,
  userBalance: UserBalance,
  recipientUserPublic: UserPublicInfo,
  userId: number,
  typeId: TransactionTypeId.SEND | TransactionTypeId.RECEIVE,
): PendingTransactionInsert {
  const pendingTx = {
    balance: userBalance.balance,
    balanceDate: tx.balanceDate,
    decay: userBalance.decay.decay,
    decayStart: userBalance.decay.start,
    decayCalculationType: DecayCalculationType.NATIVE_C_FIXED_FACTOR_INTEGER,
    userId,
    memo: tx.memo,
    previous: userBalance.lastTransactionId,
    state: PendingTransactionState.NEW,
    typeId,
    transactionLinkId: tx.transactionLinkId,
  }
  if (typeId === TransactionTypeId.SEND) {
    return {
      ...pendingTx,
      amount: tx.amount.negated(),
      linkedUserCommunityUuid: tx.recipientUser.communityUuid,
      linkedUserGradidoId: recipientUserPublic.gradidoId,
      linkedUserName: recipientUserPublic.alias,
      userCommunityUuid: tx.senderUser.communityUuid,
      userGradidoId: tx.senderUser.gradidoId,
      userName: tx.senderUser.alias,
    }
  } else {
    return {
      ...pendingTx,
      amount: tx.amount,
      linkedUserCommunityUuid: tx.senderUser.communityUuid,
      linkedUserGradidoId: tx.senderUser.gradidoId,
      linkedUserName: tx.senderUser.alias,
      userCommunityUuid: tx.recipientUser.communityUuid,
      userGradidoId: recipientUserPublic.gradidoId,
      userName: recipientUserPublic.alias,
    }
  }
}

function isPendingTransactionIdentical(
  pendingTx: PendingTransactionSelect,
  tx: TransactionSelect,
): boolean {
  // TODO: Update table schema to habe balance and amount NOT NULL
  if (!tx.balance || !pendingTx.balance || !tx.amount || !pendingTx.amount) {
    throw new Error('Expected values not set')
  }

  return (
    tx.balance.comparedTo(pendingTx.balance) === 0n &&
    tx.balanceDate.getTime() === pendingTx.balanceDate.getTime() &&
    tx.userGradidoId === pendingTx.userGradidoId &&
    tx.userName === pendingTx.userName &&
    tx.amount.comparedTo(pendingTx.amount) === 0n &&
    tx.memo === pendingTx.memo &&
    tx.linkedUserGradidoId === pendingTx.linkedUserGradidoId &&
    tx.linkedUserName === pendingTx.linkedUserName
  )
}

export function mapTxToLog(tx: CrossGroupTransaction) {
  return {
    user: tx.senderUser,
    linkedUser: tx.recipientUser,
    creationDate: tx.balanceDate.toISOString(),
    amount: tx.amount.toString(4),
    memo: tx.memo.substring(0, 5),
  }
}

// TODO: build a transaction id and use this insread of this many parameters for pending transaction selection
export async function findPendingTransaction(
  tx: CrossGroupTransaction,
  recipientUser: UserPublicInfo,
  transactionTypeId: TransactionTypeId.SEND | TransactionTypeId.RECEIVE,
  pendingTransactionState: PendingTransactionState,
  logger: Logger,
): Promise<Result<PendingTransactionSelect, CrossCommunityError>> {
  const pendingTx = await dbFindPendingTransaction(
    transactionTypeId === TransactionTypeId.SEND ? tx.senderUser : recipientUser,
    transactionTypeId === TransactionTypeId.SEND ? recipientUser : tx.senderUser,
    transactionTypeId,
    pendingTransactionState,
    tx.balanceDate,
    tx.memo,
  )

  if (!pendingTx || !pendingTx.amount || tx.amount.comparedTo(pendingTx.amount) !== 0n) {
    if (logger.isDebugEnabled()) {
      logger.debug(`didn't find a pending Tx with:`, mapTxToLog(tx))
    }
    const e = `missing pending transaction for commit on ${transactionTypeId === TransactionTypeId.SEND ? 'sender' : 'recipient'} side`
    return xcomError(CrossCommunityErrorType.notFound, e)
  }
  return { success: true, value: pendingTx }
}

export async function settlePendingTransaction(
  pendingTx: PendingTransactionSelect,
): Promise<VoidResult<CrossCommunityError>> {
  // acquire lock
  const mutex = new Mutex(AppDatabase.getInstance().getRedisClient(), 'TRANSACTIONS_LOCK')
  await mutex.acquire()
  const result = await drizzleDb().transaction(
    async (tx) => {
      // ensure that no other pendingTx with the same sender or recipient exists
      if (
        (await countOpenPendingTransactions(
          [pendingTx.linkedUserGradidoId, pendingTx.linkedUserGradidoId],
          PendingTransactionState.NEW,
          tx,
        )) > 1
      ) {
        const m = `There exist still more ongoing 'Pending-Transactions'.`
        return xcomError(CrossCommunityErrorType.previousUserTxNotFinished, m)
      }
      // make sure there wasn't slipped a transaction in between our draft and now
      const lastTransactionId = await dbGetLastTransactionId(tx)
      if (lastTransactionId !== null && lastTransactionId !== pendingTx.previous) {
        return xcomError(
          CrossCommunityErrorType.invalidTransactionOrder,
          `lastTransationId=${lastTransactionId} != pendingTx.previous=${pendingTx.previous}`,
        )
      }
      // remove id from pending tx, the rest can be simply copied over as transaction
      const { id, ...derivedTx } = pendingTx
      const insertResult = await dbInsertTransaction(derivedTx, tx)
      if (!insertResult.success) {
        const e = `Couldn't insert pending tx: ${id} as transaction`
        return xcomError(CrossCommunityErrorType.insertTxFailed, e)
      }
      await dbUpdatePendingTransactionState(pendingTx.id, PendingTransactionState.SETTLED, tx)
      return { success: true as const }
    },
    {
      isolationLevel: 'repeatable read',
    },
  )
  await mutex.release()
  return result
}

export async function revertSettledTransaction(
  pendingTx: PendingTransactionSelect,
): Promise<VoidResult<CrossCommunityError>> {
  // acquire lock
  const mutex = new Mutex(AppDatabase.getInstance().getRedisClient(), 'TRANSACTIONS_LOCK')
  await mutex.acquire()
  const result = await drizzleDb().transaction(async (tx) => {
    const lastTransaction = await dbGetLastTransactionForUser(pendingTx.userId, tx)
    if (!lastTransaction) {
      return xcomError(
        CrossCommunityErrorType.notFound,
        `user ${pendingTx.userId} hasn't a transaction at all`,
      )
    }

    // the last Tx must be the equivalent to the pendingTX
    if (isPendingTransactionIdentical(pendingTx, lastTransaction)) {
      const affectedRows = await dbRemoveTransaction(lastTransaction.id, tx)
      if (affectedRows !== 1) {
        throw new Error(`couldn't remove transaction ${lastTransaction.id} from db`)
      }
      // and mark the pendingTx in the pending_transactions table as reverted
      dbUpdatePendingTransactionState(pendingTx.id, PendingTransactionState.REVERTED, tx)
    } else {
      // TODO: if the last TX is not equivalent to pendingTX, the transactions must be corrected in EXPERT-MODE
      const e = `revert settled tx with pending tx id: ${pendingTx.id} failed, lastTransaction with id: ${lastTransaction.id} wasn't identical`
      return xcomError(CrossCommunityErrorType.unknown, e)
    }
    return { success: true as const }
  })
  mutex.release()
  return result
}
