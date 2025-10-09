import { CommunityAccountIdentifier } from './CommunityAccountIdentifier'
import { IdentifierSeed } from './IdentifierSeed'

export class AccountIdentifier {
  communityTopicId: string
  account?: CommunityAccountIdentifier
  seed?: IdentifierSeed // used for deferred transfers

  constructor(communityTopicId: string, input: CommunityAccountIdentifier | IdentifierSeed) {
    if (input instanceof CommunityAccountIdentifier) {
      this.account = input
    } else if (input instanceof IdentifierSeed) {
      this.seed = input
    }
    this.communityTopicId = communityTopicId
  }
}
