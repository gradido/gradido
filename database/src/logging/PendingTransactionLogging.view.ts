import { PendingTransaction, Transaction } from '../entity'
import { AbstractLoggingView } from './AbstractLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'
import { PendingTransactionState } from 'shared'

export class PendingTransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: PendingTransaction) {
    super()
  }

  public toJSON(): any {
    return {
      ...new TransactionLoggingView(this.self as Transaction).toJSON(),
      state: PendingTransactionState[this.self.state],
    }
  }
}
