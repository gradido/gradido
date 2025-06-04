import { FederatedCommunity } from '@/entity'
import { AbstractLoggingView } from './AbstractLogging.view'

export class FederatedCommunityLoggingView extends AbstractLoggingView {
  public constructor(private self: FederatedCommunity) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      foreign: this.self.foreign,
      publicKey: this.self.publicKey.toString(this.bufferStringFormat),
      apiVersion: this.self.apiVersion,
      endPoint: this.self.endPoint,
      lastAnnouncedAt: this.dateToString(this.self.lastAnnouncedAt),
      verifiedAt: this.self.verifiedAt,
      lastErrorAt: this.self.lastErrorAt,
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
    }
  }
}
