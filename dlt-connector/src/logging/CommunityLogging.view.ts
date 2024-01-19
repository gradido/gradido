import { Community } from '@entity/Community'

import { AbstractLoggingView } from './AbstractLogging.view'
import { AccountLoggingView } from './AccountLogging.view'

export class CommunityLoggingView extends AbstractLoggingView {
  public constructor(private self: Community) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.self.id,
      iotaTopic: this.self.iotaTopic,
      foreign: this.self.foreign,
      publicKey: this.self.rootPubkey?.toString(this.bufferStringFormat),
      createdAt: this.dateToString(this.self.createdAt),
      confirmedAt: this.dateToString(this.self.confirmedAt),
      aufAccount: this.self.aufAccount ? new AccountLoggingView(this.self.aufAccount) : undefined,
      gmwAccount: this.self.gmwAccount ? new AccountLoggingView(this.self.gmwAccount) : undefined,
    }
  }
}
