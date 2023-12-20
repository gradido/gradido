import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'

export class UpdateBalanceCreationRole extends AbstractConfirm {
  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()

    if (!transaction.accountBalanceOnConfirmation || !transaction.confirmedAt) {
      throw new LogError('missing balance or date on confirmation')
    }
    if (!transaction.accountBalanceOnCreation) {
      throw new LogError('missing balance on creation')
    }
    const account = transaction.recipientAccount
    if (!account) {
      throw new LogError('recipient account missing')
    }
    account.balanceOnConfirmation = transaction.accountBalanceOnConfirmation
    account.balanceConfirmedAt = transaction.confirmedAt
    account.balanceOnCreation = transaction.accountBalanceOnCreation
    account.balanceCreatedAt = transaction.createdAt
    this.confirmTransactionsContext.addForSave(account)
  }
}
