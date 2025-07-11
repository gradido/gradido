import { AbstractLoggingView } from 'database'

import { PublicCommunityInfo } from '@/federation/client/1_0/model/PublicCommunityInfo'

export class PublicCommunityInfoLoggingView extends AbstractLoggingView {
  public constructor(private self: PublicCommunityInfo) {
    super()
  }

  public toJSON(): any {
    return {
      name: this.self.name,
      description: this.self.description,
      creationDate: this.dateToString(this.self.creationDate),
      publicKey: this.self.publicKey,
      publicJwtKey: this.self.publicJwtKey,
    }
  }
}
