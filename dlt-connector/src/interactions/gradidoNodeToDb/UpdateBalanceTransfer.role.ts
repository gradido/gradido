import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { BalanceType, CalculateBalanceContext } from './CalculateBalance/CalculateBalance.context'

export class UpdateBalanceTransferRole extends AbstractConfirm {
  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()
    if (!transaction.accountBalanceOnConfirmation || !transaction.confirmedAt) {
      throw new LogError('missing balance for confirmation date')
    }
    if (!transaction.accountBalanceOnCreation) {
      throw new LogError('missing balance for create date')
    }
    // for sender account (singing account) balances already calculated on transaction
    const signingAccount = transaction.signingAccount
    if (signingAccount) {
      signingAccount.balanceOnConfirmation = transaction.accountBalanceOnConfirmation
      signingAccount.balanceConfirmedAt = transaction.confirmedAt
      signingAccount.balanceOnCreation = transaction.accountBalanceOnCreation
      signingAccount.balanceCreatedAt = transaction.createdAt
      this.confirmTransactionsContext.addForSave(signingAccount)
    }

    // for recipient account balances must still be calculated
    const recipientAccount = transaction.recipientAccount
    if (recipientAccount) {
      const calculateBalanceContext = new CalculateBalanceContext(transaction)
      {
        const { recipientBalance } = calculateBalanceContext.run(BalanceType.ON_CONFIRMATION)
        if (!recipientBalance) {
          throw new LogError('error calculation balance on confirmation for transfer recipient')
        }
        recipientAccount.balanceOnConfirmation = recipientBalance
        recipientAccount.balanceConfirmedAt = transaction.confirmedAt
      }
      {
        const { recipientBalance } = calculateBalanceContext.run(BalanceType.ON_CREATION)
        if (!recipientBalance) {
          throw new LogError('error calculation balance on creation for transfer recipient')
        }
        recipientAccount.balanceOnCreation = recipientBalance
        recipientAccount.balanceCreatedAt = transaction.createdAt
      }
      this.confirmTransactionsContext.addForSave(recipientAccount)
    }
  }
}
