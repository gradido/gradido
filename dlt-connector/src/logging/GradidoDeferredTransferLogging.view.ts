import { GradidoDeferredTransfer } from '@/data/proto/3_3/GradidoDeferredTransfer'

import { AbstractLoggingView } from './AbstractLogging.view'
import { GradidoTransferLoggingView } from './GradidoTransferLogging.view'

export class GradidoDeferredTransferLoggingView extends AbstractLoggingView {
  public constructor(private self: GradidoDeferredTransfer) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      ...new GradidoTransferLoggingView(this.self.transfer).toJSON(),
      ...{ timeout: this.timestampSecondsToDateString(this.self.timeout) },
    }
  }
}
