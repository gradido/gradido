import { MySql2Database } from 'drizzle-orm/mysql2'
import { PendingTransactionState } from 'shared'
import { In } from 'typeorm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { PendingTransaction as DbPendingTransaction } from '../entity'
import { PendingTransactionInsert, pendingTransactionsTable } from '../schemas'

/**
 * Counts the number of open pending transactions for the given users.
 * @param users The users gradidoID to count the pending transactions for
 * @returns The number of open pending transactions
 */
export async function countOpenPendingTransactions(users: string[]): Promise<number> {
  const count = await DbPendingTransaction.count({
    where: [
      { userGradidoID: In(users), state: PendingTransactionState.NEW },
      { linkedUserGradidoID: In(users), state: PendingTransactionState.NEW },
    ],
  })
  return count
}

/** Writes one pending transaction as it is. */
export async function dbInsertPendingTransaction(
  pendingTransaction: PendingTransactionInsert,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  await tx.insert(pendingTransactionsTable).values(pendingTransaction)
}
