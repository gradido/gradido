import { TransactionLink } from '../entity/TransactionLink'
import { AbstractLoggingView } from './AbstractLogging.view'
import { DltTransactionLoggingView } from './DltTransactionLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class TransactionLinkLoggingView extends AbstractLoggingView {
  public constructor(private self: TransactionLink) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.self.id,
      userId: this.self.userId,
      amount: this.decimalToString(this.self.amount),
      holdAvailableAmount: this.decimalToString(this.self.holdAvailableAmount),
      memoLength: this.self.memo.length,
      createdAt: this.dateToString(this.self.createdAt),
      deletedAt: this.dateToString(this.self.deletedAt),
      validUntil: this.dateToString(this.self.validUntil),
      redeemedAt: this.dateToString(this.self.redeemedAt),
      redeemedBy: this.self.redeemedBy,
      dltTransaction: this.self.dltTransaction
        ? new DltTransactionLoggingView(this.self.dltTransaction).toJSON()
        : undefined,
      user: this.self.user ? new UserLoggingView(this.self.user).toJSON() : undefined,
      transactions: this.self.transactions.forEach(
        (transaction) => new TransactionLoggingView(transaction),
      ),
    }
  }
}
