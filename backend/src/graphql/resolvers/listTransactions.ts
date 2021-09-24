import { User as dbUser } from '../../typeorm/entity/User'
import { TransactionList, Transaction } from '../models/Transaction'
import { UserTransaction as dbUserTransaction } from '../../typeorm/entity/UserTransaction'
import { Transaction as dbTransaction } from '../../typeorm/entity/Transaction'
import { TransactionSendCoin as dbTransactionSendCoin} from '../../typeorm/entity/TransactionSendCoin'
import { TransactionCreation as dbTransactionCreation} from '../../typeorm/entity/TransactionCreation'
import calculateDecay from '../../util/decay'
import { roundFloorFrom4 } from '../../util/round'

async function calculateAndAddDecayTransactions(
  userTransactions: dbUserTransaction[],
  user: dbUser,
  decay: boolean,
  skipFirstTransaction: boolean,
): Promise<Transaction[]> {
  let finalTransactions: Transaction[] = []
  let transactionIds: number[] = []
  let involvedUserIds: number[] = []

  userTransactions.forEach((userTransaction: dbUserTransaction) => {
    transactionIds.push(userTransaction.transactionId)
    involvedUserIds.push(userTransaction.userId)
  })
  // remove duplicates
  // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
  const involvedUsersUnique = involvedUserIds.filter((v, i, a) => a.indexOf(v) === i)
  const userIndiced = dbUser.getUsersIndiced(involvedUsersUnique)

  const transactions = await dbTransaction
      .createQueryBuilder('transaction')
      .where('transaction.id IN (:...transactions)', { transactions: transactionIds})
      .leftJoinAndSelect('transaction.sendCoin', 'transactionSendCoin', 'transactionSendCoin.transactionid = transaction.id')
      .leftJoinAndSelect('transaction.creation', 'transactionCreation', 'transactionSendCoin.transactionid = transaction.id')
      .getMany()
  
  let transactionIndiced: dbTransaction[] = []
  transactions.forEach((transaction: dbTransaction) => {
    transactionIndiced[transaction.id] = transaction
  })  

  const decayStartTransaction = await dbTransaction.createQueryBuilder('transaction')
      .where('transaction.transactionTypeId = :transactionTypeId', { transactionTypeId: 9})
      .orderBy('received', 'ASC')
      .getOne()
  
  userTransactions.forEach((userTransaction: dbUserTransaction, i:number) => {
    const transaction = transactionIndiced[userTransaction.transactionId]
    let finalTransaction = new Transaction
    finalTransaction.transactionId = transaction.id 
    finalTransaction.date = transaction.received.toString()
    finalTransaction.memo = transaction.memo

    let prev = i > 0 ? userTransactions[i-1] : null
    if(prev && prev.balance > 0) {
      
    }

  })


  return finalTransactions
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
