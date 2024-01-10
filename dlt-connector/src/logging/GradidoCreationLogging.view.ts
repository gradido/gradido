import { GradidoCreation } from '@/data/proto/3_3/GradidoCreation'

import { AbstractLoggingView } from './AbstractLogging.view'
import { TransferAmountLoggingView } from './TransferAmountLogging.view'

export class GradidoCreationLoggingView extends AbstractLoggingView {
  public constructor(private self: GradidoCreation) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      recipient: new TransferAmountLoggingView(this.self.recipient).toJSON(),
      targetDate: this.timestampSecondsToDateString(this.self.targetDate),
    }
  }
}
