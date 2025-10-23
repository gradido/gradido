import { Community } from '../entity'
import { FederatedCommunityLoggingView } from './FederatedCommunityLogging.view'
import { AbstractLoggingView } from './AbstractLogging.view'

export class CommunityLoggingView extends AbstractLoggingView {
  public constructor(private self: Community) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      foreign: this.self.foreign,
      url: this.self.url,
      publicKey: this.self.publicKey.toString(this.bufferStringFormat),
      publicJwtKey: this.self.publicJwtKey,
      communityUuid: this.self.communityUuid,
      authenticatedAt: this.dateToString(this.self.authenticatedAt),
      name: this.self.name,
      description: this.self.description?.substring(0, 24),
      creationDate: this.dateToString(this.self.creationDate),
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
      federatedCommunities: this.self.federatedCommunities?.map(
        (federatedCommunity) => new FederatedCommunityLoggingView(federatedCommunity)
      ),
    }
  }
}
