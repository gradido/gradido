import { User as dbUser } from '../../typeorm/entity/User'
import { TransactionList, Transaction } from '../models/Transaction'
import { UserTransaction as dbUserTransaction } from '../../typeorm/entity/UserTransaction'
import { Transaction as dbTransaction } from '../../typeorm/entity/Transaction'
import { Decay } from '../models/Decay'
import { calculateDecayWithInterval } from '../../util/decay'
import { roundFloorFrom4 } from '../../util/round'

async function calculateAndAddDecayTransactions(
  userTransactions: dbUserTransaction[],
  user: dbUser,
  decay: boolean,
  skipFirstTransaction: boolean,
): Promise<Transaction[]> {
  const finalTransactions: Transaction[] = []
  const transactionIds: number[] = []
  const involvedUserIds: number[] = []

  userTransactions.forEach((userTransaction: dbUserTransaction) => {
    transactionIds.push(userTransaction.transactionId)
    involvedUserIds.push(userTransaction.userId)
  })
  // remove duplicates
  // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
  const involvedUsersUnique = involvedUserIds.filter((v, i, a) => a.indexOf(v) === i)
  const userIndiced = await dbUser.getUsersIndiced(involvedUsersUnique)

  const transactions = await dbTransaction
    .createQueryBuilder('transaction')
    .where('transaction.id IN (:...transactions)', { transactions: transactionIds })
    .leftJoinAndSelect(
      'transaction.sendCoin',
      'transactionSendCoin',
      'transactionSendCoin.transactionid = transaction.id',
    )
    .leftJoinAndSelect(
      'transaction.creation',
      'transactionCreation',
      'transactionSendCoin.transactionid = transaction.id',
    )
    .getMany()

  const transactionIndiced: dbTransaction[] = []
  transactions.forEach((transaction: dbTransaction) => {
    transactionIndiced[transaction.id] = transaction
  })

  const decayStartTransaction = await Decay.getDecayStartBlock()

  userTransactions.forEach(async (userTransaction: dbUserTransaction, i: number) => {
    const transaction = transactionIndiced[userTransaction.transactionId]
    const finalTransaction = new Transaction()
    finalTransaction.transactionId = transaction.id
    finalTransaction.date = transaction.received.toString()
    finalTransaction.memo = transaction.memo
    finalTransaction.totalBalance = roundFloorFrom4(userTransaction.balance)

    const prev = i > 0 ? userTransactions[i - 1] : null
    if (prev && prev.balance > 0) {
      const current = userTransaction
      const decay = await calculateDecayWithInterval(
        prev.balance,
        prev.balanceDate,
        current.balanceDate,
      )
      const balance = prev.balance - decay.balance

      if (balance) {
        finalTransaction.decay = decay
        finalTransaction.decay.balance = roundFloorFrom4(finalTransaction.decay.balance)
        finalTransaction.decay.balance = roundFloorFrom4(balance)
        if (
          decayStartTransaction &&
          prev.transactionId < decayStartTransaction.id &&
          current.transactionId > decayStartTransaction.id
        ) {
          finalTransaction.decay.decayStartBlock = decayStartTransaction.received.getTime()
        }
      }
    }

    // sender or receiver when user has sended money
    // group name if creation
    // type: gesendet / empfangen / geschöpft
    // transaktion nr / id
    // date
    // balance
    if (userTransaction.transactionTypeId === 1) {
      // creation
      const creation = transaction.transactionCreation

      finalTransaction.name = 'Gradido Akademie'
      finalTransaction.type = 'creation'
      // finalTransaction.targetDate = creation.targetDate
      finalTransaction.balance = roundFloorFrom4(creation.amount)
    } else if (userTransaction.transactionTypeId === 2) {
      // send coin
      const sendCoin = transaction.transactionSendCoin
      let otherUser: dbUser | undefined
      finalTransaction.balance = roundFloorFrom4(sendCoin.amount)
      if (sendCoin.userId === user.id) {
        finalTransaction.type = 'send'
        otherUser = userIndiced[sendCoin.recipiantUserId]
        // finalTransaction.pubkey = sendCoin.recipiantPublic
      } else if (sendCoin.recipiantUserId === user.id) {
        finalTransaction.type = 'receive'
        otherUser = userIndiced[sendCoin.userId]
        // finalTransaction.pubkey = sendCoin.senderPublic
      } else {
        throw new Error('invalid transaction')
      }
      if (otherUser) {
        finalTransaction.name = otherUser.firstName + ' ' + otherUser.lastName
        finalTransaction.email = otherUser.email
      }
    }
    if (i > 0 || !skipFirstTransaction) {
      finalTransactions.push(finalTransaction)
    }
    if (i === userTransactions.length - 1 && decay) {
      const now = new Date()
      const decay = await calculateDecayWithInterval(
        userTransaction.balance,
        userTransaction.balanceDate,
        now.getTime(),
      )
      const balance = userTransaction.balance - decay.balance
      if (balance) {
        const decayTransaction = new Transaction()
        decayTransaction.type = 'decay'
        decayTransaction.balance = roundFloorFrom4(balance)
        decayTransaction.decayDuration = decay.decayDuration
        decayTransaction.decayStart = decay.decayStart
        decayTransaction.decayEnd = decay.decayEnd
        finalTransactions.push(decayTransaction)
      }
    }
    return finalTransactions
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
  let [userTransactions, userTransactionsCount] = await dbUserTransaction.findByUserPaged(
    user.id,
    limit,
    offset,
    order,
  )
  skipFirstTransaction = userTransactionsCount > offset + limit
  const decay = !(firstPage > 1)
  let transactions: Transaction[] = []
  if (userTransactions.length) {
    if (order === 'DESC') {
      userTransactions = userTransactions.reverse()
    }
    transactions = await calculateAndAddDecayTransactions(
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
