import { GradidoTransfer } from '@/data/proto/3_3/GradidoTransfer'

import { AbstractLoggingView } from './AbstractLogging.view'
import { TransferAmountLoggingView } from './TransferAmountLogging.view'

export class GradidoTransferLoggingView extends AbstractLoggingView {
  public constructor(private self: GradidoTransfer) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      sender: new TransferAmountLoggingView(this.self.sender),
      recipient: Buffer.from(this.self.recipient).toString(this.bufferStringFormat),
    }
  }
}
