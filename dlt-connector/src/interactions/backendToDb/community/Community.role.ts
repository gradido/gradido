import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'

export abstract class CommunityRole {
  abstract addCommunity(communityDraft: CommunityDraft, topic: string): Promise<Community>
}
