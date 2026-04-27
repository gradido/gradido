import { Decay, fullName, GradidoUnit } from 'shared'
import { Transaction, User } from '../../entity'
import { TransactionTypeId } from '../../enum'
import { getLastTransaction } from '../../queries'

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
