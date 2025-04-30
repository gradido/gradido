import { DltTransaction } from '../entity/DltTransaction'
import { AbstractLoggingView } from './AbstractLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'

export class DltTransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: DltTransaction) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      transaction: this.self.transaction
        ? new TransactionLoggingView(this.self.transaction).toJSON()
        : { id: this.self.transactionId },
      messageId: this.self.messageId,
      verified: this.self.verified,
      createdAt: this.dateToString(this.self.createdAt),
      verifiedAt: this.dateToString(this.self.verifiedAt),
    }
  }
}
