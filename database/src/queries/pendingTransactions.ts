import { and, count, eq, inArray, or } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Memo, PendingTransactionState, Result, UserPublicInfo } from 'shared'
import {
  DBInsertFailed,
  DrizzleTransaction,
  drizzleDb,
  PendingTransactionInsert,
  PendingTransactionSelect,
  pendingTransactionsTable,
  TransactionTypeId,
} from '..'

const pendingTransactionInsertFailed = (row: PendingTransactionInsert) =>
  new DBInsertFailed<PendingTransactionInsert>('pending_transactions', row)

/**
 * TODO: add Timeout for preventing dead lock
 * Counts the number of open pending transactions for the given users.
 * @param users The users gradidoID to count the pending transactions for
 * @returns The number of open pending transactions
 */
export async function countOpenPendingTransactions(
  users: string[],
  state: PendingTransactionState,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx
    .select({ count: count() })
    .from(pendingTransactionsTable)
    .where(
      and(
        eq(pendingTransactionsTable.state, state),
        or(
          inArray(pendingTransactionsTable.userGradidoId, users),
          inArray(pendingTransactionsTable.linkedUserGradidoId, users),
        ),
      ),
    )
  return rows[0]?.count ?? 0
}

export async function dbInsertPendingTransaction(
  pendingTransaction: PendingTransactionInsert,
): Promise<Result<number, DBInsertFailed<PendingTransactionInsert>>> {
  const rows = await drizzleDb().insert(pendingTransactionsTable).values(pendingTransaction)
  const firstRow = rows[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: firstRow.insertId }
  }
  return { success: false, error: pendingTransactionInsertFailed(pendingTransaction) }
}

export async function dbFindPendingTransaction(
  user: UserPublicInfo,
  linkedUser: UserPublicInfo,
  transactionTypeId: TransactionTypeId,
  pendingTransactionState: PendingTransactionState,
  balanceDate: Date,
  memo: Memo,
): Promise<PendingTransactionSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(pendingTransactionsTable)
    .where(
      and(
        eq(pendingTransactionsTable.userCommunityUuid, user.communityUuid),
        eq(pendingTransactionsTable.userGradidoId, user.gradidoId),
        eq(pendingTransactionsTable.linkedUserCommunityUuid, linkedUser.communityUuid),
        eq(pendingTransactionsTable.linkedUserGradidoId, linkedUser.gradidoId),
        eq(pendingTransactionsTable.typeId, transactionTypeId),
        eq(pendingTransactionsTable.state, pendingTransactionState),
        eq(pendingTransactionsTable.balanceDate, balanceDate),
        eq(pendingTransactionsTable.memo, memo),
      ),
    )
  return rows[0] ?? null
}

export async function dbRemovePendingTransaction(
  user: UserPublicInfo,
  linkedUser: UserPublicInfo,
  transactionTypeId: TransactionTypeId,
  pendingTransactionState: PendingTransactionState,
  balanceDate: Date,
  memo: Memo,
): Promise<number> {
  const rows = await drizzleDb()
    .delete(pendingTransactionsTable)
    .where(
      and(
        eq(pendingTransactionsTable.userCommunityUuid, user.communityUuid),
        eq(pendingTransactionsTable.userGradidoId, user.gradidoId),
        eq(pendingTransactionsTable.linkedUserCommunityUuid, linkedUser.communityUuid),
        eq(pendingTransactionsTable.linkedUserGradidoId, linkedUser.gradidoId),
        eq(pendingTransactionsTable.typeId, transactionTypeId),
        eq(pendingTransactionsTable.state, pendingTransactionState),
        eq(pendingTransactionsTable.balanceDate, balanceDate),
        eq(pendingTransactionsTable.memo, memo),
      ),
    )
  return rows[0].affectedRows
}

export async function dbUpdatePendingTransactionState(
  id: number,
  state: PendingTransactionState,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx
    .update(pendingTransactionsTable)
    .set({ state })
    .where(eq(pendingTransactionsTable.id, id))
  return rows[0].affectedRows
}
