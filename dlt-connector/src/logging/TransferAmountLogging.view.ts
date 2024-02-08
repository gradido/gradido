import { TransferAmount } from '@/data/proto/3_3/TransferAmount'

import { AbstractLoggingView } from './AbstractLogging.view'

export class TransferAmountLoggingView extends AbstractLoggingView {
  public constructor(private self: TransferAmount) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      publicKey: Buffer.from(this.self.pubkey).toString(this.bufferStringFormat),
      amount: this.self.amount,
      communityId: this.self.communityId,
    }
  }
}
