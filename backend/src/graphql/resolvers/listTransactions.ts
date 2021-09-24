import { User as dbUser } from '../../typeorm/entity/User'
import { TransactionList, Transaction } from '../models/Transaction'
import { UserTransaction } from '../../typeorm/entity/UserTransaction'

function calculateAndAddDecayTransactions(
  userTransactions: UserTransaction[],
  user: dbUser,
  decay: boolean,
  skipFirstTransaction: boolean,
): Transaction[] {
  const transactions: Transaction[] = []

  return transactions
}

export default async function listTransactions(
  firstPage: number,
  items: number,
  order: 'ASC' | 'DESC',
  user: dbUser,
): Promise<TransactionList> {
  let limit = items
  let offset = 0
  let skipFirstTransaction = false
  if (firstPage > 1) {
    offset = (firstPage - 1) * items - 1
    limit++
  }

  if (offset && order === 'ASC') {
    offset--
  }
  let [userTransactions, userTransactionsCount] = await UserTransaction.findByUserPaged(
    user.id,
    limit,
    offset,
    order,
  )
  skipFirstTransaction = userTransactionsCount > offset + limit
  const decay = !(firstPage > 1)
  const transactions: Transaction[] = []
  if (userTransactions.length) {
    if (order === 'DESC') {
      userTransactions = userTransactions.reverse()
    }
    let transactions = calculateAndAddDecayTransactions(
      userTransactions,
      user,
      decay,
      skipFirstTransaction,
    )
    if (order === 'DESC') {
      transactions = transactions.reverse()
    }
  }

  const transactionList = new TransactionList({
    gdtSum: 0,
    count: userTransactionsCount,
    balance: 0,
    decay: 0,
    decay_date: '',
    transactions: transactions,
  })

  return transactionList
}
