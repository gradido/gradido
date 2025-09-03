import { CommunityUser } from './CommunityUser'
import { IdentifierSeed } from './IdentifierSeed'

export class UserIdentifier {
  communityUuid: string
  communityUser?: CommunityUser
  seed?: IdentifierSeed // used for deferred transfers

  constructor(communityUuid: string, input: CommunityUser | IdentifierSeed) {
    if (input instanceof CommunityUser) {
      this.communityUser = input
    } else if (input instanceof IdentifierSeed) {
      this.seed = input
    }
    this.communityUuid = communityUuid
  }
}
