import { Community } from '@entity/Community'

import { AbstractLoggingView } from './AbstractLogging.view'
import { AccountLoggingView } from './AccountLogging.view'

export class CommunityLoggingView extends AbstractLoggingView {
  public constructor(private community: Community) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.community.id,
      iotaTopic: this.community.iotaTopic,
      foreign: this.community.foreign,
      publicKey: this.community.rootPubkey?.toString(this.bufferStringFormat),
      createdAt: this.dateToString(this.community.createdAt),
      confirmedAt: this.dateToString(this.community.confirmedAt),
      aufAccount: this.community.aufAccount
        ? new AccountLoggingView(this.community.aufAccount)
        : null,
      gmwAccount: this.community.gmwAccount
        ? new AccountLoggingView(this.community.gmwAccount)
        : null,
    }
  }
}
