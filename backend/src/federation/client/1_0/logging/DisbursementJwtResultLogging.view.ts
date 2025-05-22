import { AbstractLoggingView } from 'database'

import { DisbursementJwtResult } from '@/federation/client/1_0/model/DisbursementJwtResult'

export class DisbursementJwtResultLoggingView extends AbstractLoggingView {
  public constructor(private self: DisbursementJwtResult) {
    super()
  }

  public toJSON(): any {
    return {
      accepted: this.self.accepted,
      acceptedAt: this.self.acceptedAt,
      transactionId: this.self.transactionId,
      message: this.self.message,
    }
  }
}
