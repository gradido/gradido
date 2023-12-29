import { TransactionLogic } from '@/data/Transaction.logic'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'

export class UpdateBalanceBackendTransactionRole extends AbstractConfirm {
  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()
    const transactionLogic = new TransactionLogic(transaction)
    for (const backendTransaction of transaction.backendTransactions) {
      const balanceAccount = transactionLogic.getBalanceAccount(
        backendTransaction.typeId as InputTransactionType,
      )
      if (!balanceAccount) {
        throw new LogError('missing balance account')
      }
      backendTransaction.balance = balanceAccount.balanceOnCreation
      backendTransaction.confirmedAt = transaction.confirmedAt
      this.confirmTransactionsContext.addForSave(backendTransaction)
    }
  }
}
