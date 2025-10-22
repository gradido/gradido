import { PendingTransaction as DbPendingTransaction, User as DbUser } from '../..'
import { PendingTransactionState } from 'shared'
import { Decimal } from 'decimal.js-light'

export async function pendingTransactionFactory(
  sender: DbUser,
  receiver: DbUser,
  amount: Decimal,
  memo: string,
  state: PendingTransactionState,
) {
  const pendingTransaction = new DbPendingTransaction()
  pendingTransaction.state = state
  pendingTransaction.memo = memo
  pendingTransaction.amount = amount
  pendingTransaction.userId = sender.id
  pendingTransaction.userGradidoID = sender.gradidoID    
  pendingTransaction.userCommunityUuid = sender.communityUuid!    
  pendingTransaction.linkedUserId = receiver.id
  pendingTransaction.linkedUserGradidoID = receiver.gradidoID
  pendingTransaction.linkedUserCommunityUuid = receiver.communityUuid!
  await pendingTransaction.save()
}
