import { PendingTransactionState } from 'shared'
import { In } from 'typeorm'
import { PendingTransaction as DbPendingTransaction } from '../entity'

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
