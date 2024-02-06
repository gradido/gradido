import { SignatureMap } from '@/data/proto/3_3/SignatureMap'

import { AbstractLoggingView } from './AbstractLogging.view'
import { SignaturePairLoggingView } from './SignaturePairLogging.view'

export class SignatureMapLoggingView extends AbstractLoggingView {
  public constructor(private self: SignatureMap) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      sigPair: this.self.sigPair.map((value) => new SignaturePairLoggingView(value).toJSON()),
    }
  }
}
