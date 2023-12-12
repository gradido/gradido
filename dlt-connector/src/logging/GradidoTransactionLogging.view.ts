import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'

import { AbstractLoggingView } from './AbstractLogging.view'
import { SignatureMapLoggingView } from './SignatureMapLogging.view'

export class GradidoTransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: GradidoTransaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      sigMap: new SignatureMapLoggingView(this.self.sigMap).toJSON(),
      bodyBytesLength: this.self.bodyBytes.length,
      parentMessageId: this.self.parentMessageId
        ? Buffer.from(this.self.parentMessageId).toString(this.bufferStringFormat)
        : undefined,
    }
  }
}
