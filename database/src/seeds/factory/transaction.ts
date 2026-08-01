import { Decay, fullName, GradidoUnit } from 'shared'
import { Transaction } from '../../entity'
import { TransactionTypeId } from '../../enum'
import { getLastTransaction } from '../../queries'
/**
 * The fields the transaction factories need from a user. Kept structural so both
 * a drizzle-backed SeedUser and a mapped typeorm entity satisfy it while the two
 * ORMs coexist.
 */
export type TransactionUser = {
  id: number
  gradidoId: string
  firstName: string | null
  lastName: string | null
  communityUuid: string | null
}

export async function transferGradidos(
  sendUser: TransactionUser,
  recipientUser: TransactionUser,
  amount: GradidoUnit,
  memo: string,
  balanceDate: Date,
  store: boolean = true,
): Promise<[Transaction, Transaction]> {
  // send transaction
  const sendResolver = createTransaction(
    amount,
    memo,
    sendUser,
    recipientUser,
    TransactionTypeId.SEND,
    balanceDate,
    undefined,
    undefined,
    store,
  )

  // receive transaction
  const receiveResolver = createTransaction(
    amount,
    memo,
    recipientUser,
    sendUser,
    TransactionTypeId.RECEIVE,
    balanceDate,
    undefined,
    undefined,
    store,
  )

  const [tx1, tx2] = await Promise.all([sendResolver, receiveResolver])
  if (store) {
    tx1.linkedTransactionId = tx2.id
    tx2.linkedTransactionId = tx1.id
    return await Promise.all([tx1.save(), tx2.save()])
  }
  return [tx1, tx2]
}

export async function createTransaction(
  amount: GradidoUnit,
  memo: string,
  user: TransactionUser,
  linkedUser: TransactionUser,
  type: TransactionTypeId,
  balanceDate: Date,
  creationDate?: Date,
  id?: number,
  store: boolean = true,
): Promise<Transaction> {
  const lastTransaction = await getLastTransaction(user.id)
  // balance and decay calculation
  let newBalance = new GradidoUnit(0n)
  let decay: Decay | null = null
  if (lastTransaction) {
    const lastTransactionBalance = lastTransaction.balance
    decay = lastTransactionBalance.calculateDecay(lastTransaction.balanceDate, balanceDate)
    newBalance = decay.balance
  }
  newBalance = newBalance.add(amount)

  const transaction = new Transaction()
  if (id) {
    transaction.id = id
  }
  transaction.typeId = type
  transaction.memo = memo
  transaction.userId = user.id
  transaction.userGradidoID = user.gradidoId
  transaction.userName = fullName(user.firstName ?? '', user.lastName ?? '')
  transaction.userCommunityUuid = user.communityUuid
  transaction.linkedUserId = linkedUser.id
  transaction.linkedUserGradidoID = linkedUser.gradidoId
  transaction.linkedUserName = fullName(linkedUser.firstName ?? '', linkedUser.lastName ?? '')
  transaction.linkedUserCommunityUuid = linkedUser.communityUuid
  transaction.previous = lastTransaction ? lastTransaction.id : null
  transaction.amount = amount
  if (creationDate) {
    transaction.creationDate = creationDate
  }
  transaction.balance = newBalance
  transaction.balanceDate = balanceDate
  transaction.decay = decay ? decay.decay : new GradidoUnit(0n)
  transaction.decayStart = decay ? decay.start : null

  return store ? transaction.save() : transaction
}
