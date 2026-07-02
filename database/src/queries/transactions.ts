import { eq } from 'drizzle-orm'
import { GradidoUnit, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { Transaction as DbTransaction } from '../entity'
import { DBNotFoundError } from '../errorTypes'
import { transactionsTable } from '../schemas'

export const getLastTransaction = async (
  userId: number,
  relations?: string[],
): Promise<DbTransaction | null> => {
  return DbTransaction.findOne({
    where: { userId },
    order: { balanceDate: 'DESC', id: 'DESC' },
    relations,
  })
}

const TransactionNotFound = (where: string) => new DBNotFoundError('transactions', where)

export async function dbUpdateBalanceAndDate(txPart: {
  id: number
  balance: GradidoUnit
  balanceDate: Date
}): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(transactionsTable)
    .set({
      balance: txPart.balance,
      balanceDate: txPart.balanceDate,
    })
    .where(eq(transactionsTable.id, txPart.id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: TransactionNotFound(`id = ${txPart.id}`),
  }
}
