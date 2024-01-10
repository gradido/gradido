import { CommunityRoot } from '@/data/proto/3_3/CommunityRoot'

import { AbstractLoggingView } from './AbstractLogging.view'

export class CommunityRootLoggingView extends AbstractLoggingView {
  public constructor(private self: CommunityRoot) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      rootPubkey: Buffer.from(this.self.rootPubkey).toString(this.bufferStringFormat),
      gmwPubkey: Buffer.from(this.self.gmwPubkey).toString(this.bufferStringFormat),
      aufPubkey: Buffer.from(this.self.aufPubkey).toString(this.bufferStringFormat),
    }
  }
}
