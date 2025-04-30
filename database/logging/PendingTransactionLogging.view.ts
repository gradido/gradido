import { PendingTransaction } from '../entity/PendingTransaction'
import { Transaction } from '../entity/Transaction'
import { AbstractLoggingView } from './AbstractLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'

// TODO: move enum into database, maybe rename database
enum PendingTransactionState {
  NEW = 1,
  PENDING = 2,
  SETTLED = 3,
  REVERTED = 4,
}

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
