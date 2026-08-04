import { GradidoUnit, PendingTransactionState } from 'shared'
import { PendingTransaction as DbPendingTransaction } from '../..'
import { FullUser } from '../../schemas'

export async function pendingTransactionFactory(
  sender: FullUser,
  receiver: FullUser,
  amount: GradidoUnit,
  memo: string,
  state: PendingTransactionState,
) {
  const pendingTransaction = new DbPendingTransaction()
  pendingTransaction.state = state
  pendingTransaction.memo = memo
  pendingTransaction.amount = amount
  pendingTransaction.userId = sender.id
  pendingTransaction.userGradidoID = sender.gradidoId
  pendingTransaction.userCommunityUuid = sender.communityUuid!
  pendingTransaction.linkedUserId = receiver.id
  pendingTransaction.linkedUserGradidoID = receiver.gradidoId
  pendingTransaction.linkedUserCommunityUuid = receiver.communityUuid!
  await pendingTransaction.save()
}
