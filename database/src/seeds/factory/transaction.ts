import { Decay, fullName, GradidoUnit } from 'shared'
import { Transaction, User } from '../../entity'
import { TransactionTypeId } from '../../enum'
import { getLastTransaction } from '../../queries'

export async function transferGradidos(
  sendUser: User,
  recipientUser: User,
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
  user: User,
  linkedUser: User,
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
  transaction.userGradidoID = user.gradidoID
  transaction.userName = fullName(user.firstName, user.lastName)
  transaction.userCommunityUuid = user.communityUuid
  transaction.linkedUserId = linkedUser.id
  transaction.linkedUserGradidoID = linkedUser.gradidoID
  transaction.linkedUserName = fullName(linkedUser.firstName, linkedUser.lastName)
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
