import { BackendTransaction } from '@entity/BackendTransaction'

import { TransactionDraft } from '@/graphql/input/TransactionDraft'

export class BackendTransactionFactory {
  public static createFromTransactionDraft(transactionDraft: TransactionDraft): BackendTransaction {
    const backendTransaction = BackendTransaction.create()
    backendTransaction.backendTransactionId = transactionDraft.backendTransactionId
    backendTransaction.typeId = transactionDraft.type
    backendTransaction.createdAt = new Date(transactionDraft.createdAt)
    return backendTransaction
  }
}
