import { CommunityAccountIdentifier } from './CommunityAccountIdentifier'
export class AccountIdentifier {
  communityTopicId: string
  communityId: string
  account?: CommunityAccountIdentifier
  seed?: string // used for deferred transfers

  constructor(
    communityTopicId: string,
    communityUuid: string,
    input: CommunityAccountIdentifier | string,
  ) {
    if (input instanceof CommunityAccountIdentifier) {
      this.account = input
    } else {
      this.seed = input
    }
    this.communityTopicId = communityTopicId
    this.communityId = communityUuid
  }
}
