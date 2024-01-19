import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { timestampSecondsToDate } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { GradidoTransactionLoggingView } from './GradidoTransactionLogging.view'

export class ConfirmedTransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: ConfirmedTransaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.self.id.toString(),
      transaction: new GradidoTransactionLoggingView(this.self.transaction).toJSON(),
      confirmedAt: this.dateToString(timestampSecondsToDate(this.self.confirmedAt)),
      versionNumber: this.self.versionNumber,
      runningHash: Buffer.from(this.self.runningHash).toString(this.bufferStringFormat),
      messageId: Buffer.from(this.self.messageId).toString(this.bufferStringFormat),
      accountBalance: this.self.accountBalance,
    }
  }
}
