import { BackendTransactionRepository } from '@/data/BackendTransaction.repository'
import { TransactionLogic } from '@/data/Transaction.logic'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { AccountLoggingView } from '@/logging/AccountLogging.view'
import { LogError } from '@/server/LogError'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractConfirm } from './AbstractConfirm.role'

export class UpdateBalanceBackendTransactionRole extends AbstractConfirm {
  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()
    if (!transaction.backendTransactions) {
      const backendTransactions = await BackendTransactionRepository.findOneBy({
        transactionId: transaction.id,
      })
      throw new LogError(
        'missing backend transactions, find with manual search',
        backendTransactions,
      )
    }
    const transactionLogic = new TransactionLogic(transaction)
    for (const backendTransaction of transaction.backendTransactions) {
      const balanceAccount = transactionLogic.getBalanceAccount(
        backendTransaction.typeId as InputTransactionType,
      )
      if (!balanceAccount) {
        throw new LogError('missing balance account', {
          balanceAccount,
          transactionType: getEnumValue(InputTransactionType, backendTransaction.typeId),
          transactionId: transaction.id,
          recipientAccount: transaction.recipientAccount
            ? new AccountLoggingView(transaction.recipientAccount)
            : 'undefined',
        })
      }
      backendTransaction.balance = balanceAccount.balanceOnCreation
      backendTransaction.confirmedAt = transaction.confirmedAt
    }
  }
}
