import { SignatureMap } from '@/data/proto/3_3/SignatureMap'

import { AbstractLoggingView } from './AbstractLogging.view'
import { SignaturePairLoggingView } from './SignaturePairLogging.view'

export class SignatureMapLoggingView extends AbstractLoggingView {
  public constructor(private self: SignatureMap) {
    super()
  }

  public toJSON() {
    return {
      sigPair: this.self.sigPair.map((value) => new SignaturePairLoggingView(value).toJSON()),
    }
  }
}
