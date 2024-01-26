import { CommunityRepository } from '@/data/Community.repository'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'

export class ConfirmCommunityRole extends AbstractConfirm {
  constructor(
    confirmedTransactionRole: ConfirmedTransactionRole,
    confirmTransactionsContext: ConfirmTransactionsContext,
    private transactionBody: TransactionBody,
  ) {
    super(confirmedTransactionRole, confirmTransactionsContext)
  }

  public async confirm(): Promise<void> {
    await CommunityRepository.confirmCommunityAndAccounts(
      this.confirmedTransactionRole.getConfirmedAt(),
      this.confirmTransactionsContext.getIotaTopic(),
      this.transactionBody.communityRoot?.rootPubkey,
    )
  }
}
