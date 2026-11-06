import { GradidoUnit, PendingTransactionState } from 'shared'
import { User as DbUser } from '../..'
import { dbInsertPendingTransaction } from '../../queries/pendingTransactions'

export async function pendingTransactionFactory(
  sender: DbUser,
  receiver: DbUser,
  amount: GradidoUnit,
  memo: string,
  state: PendingTransactionState,
) {
  await dbInsertPendingTransaction({
    state,
    memo,
    amount,
    userId: sender.id,
    userGradidoId: sender.gradidoID,
    userCommunityUuid: sender.communityUuid!,
    linkedUserId: receiver.id,
    linkedUserGradidoId: receiver.gradidoID,
    linkedUserCommunityUuid: receiver.communityUuid!,
  })
}
