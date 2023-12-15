import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'

import { AbstractLoggingView } from './AbstractLogging.view'
import { SignatureMapLoggingView } from './SignatureMapLogging.view'
import { TransactionBodyLoggingView } from './TransactionBodyLogging.view'

export class GradidoTransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: GradidoTransaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    let transactionBody: TransactionBody | null | unknown = null
    try {
      transactionBody = new TransactionBodyLoggingView(this.self.getTransactionBody())
    } catch (e) {
      transactionBody = e
    }
    return {
      sigMap: new SignatureMapLoggingView(this.self.sigMap).toJSON(),
      bodyBytes: transactionBody,
      parentMessageId: this.self.parentMessageId
        ? Buffer.from(this.self.parentMessageId).toString(this.bufferStringFormat)
        : undefined,
    }
  }
}
