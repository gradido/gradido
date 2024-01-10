import { SignaturePair } from '@/data/proto/3_3/SignaturePair'

import { AbstractLoggingView } from './AbstractLogging.view'

export class SignaturePairLoggingView extends AbstractLoggingView {
  public constructor(private self: SignaturePair) {
    super()
  }

  public toJSON() {
    return {
      pubkey: Buffer.from(this.self.pubKey).toString(this.bufferStringFormat),
      signature:
        Buffer.from(this.self.signature).subarray(0, 31).toString(this.bufferStringFormat) + '..',
    }
  }
}
