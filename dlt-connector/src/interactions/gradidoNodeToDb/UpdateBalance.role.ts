import { Account } from '@entity/Account'

import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'

export class UpdateBalanceRole extends AbstractConfirm {
  public constructor(
    confirmedTransactionRole: ConfirmedTransactionRole,
    confirmTransactionsContext: ConfirmTransactionsContext,
    private account: Account,
  ) {
    super(confirmedTransactionRole, confirmTransactionsContext)
  }

  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()
    if (!transaction.accountBalanceOnConfirmation || !transaction.confirmedAt) {
      throw new LogError('missing balance for confirmation date')
    }
    if (!transaction.accountBalanceOnCreation) {
      throw new LogError('missing balance for create date')
    }
    this.account.balanceOnConfirmation = transaction.accountBalanceOnConfirmation
    this.account.balanceConfirmedAt = transaction.confirmedAt
    this.account.balanceOnCreation = transaction.accountBalanceOnCreation
    this.account.balanceCreatedAt = transaction.createdAt
    this.confirmTransactionsContext.addForSave(this.account)
  }
}
