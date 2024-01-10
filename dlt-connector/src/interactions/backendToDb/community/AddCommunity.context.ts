import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

import { CommunityRole } from './Community.role'
import { ForeignCommunityRole } from './ForeignCommunity.role'
import { HomeCommunityRole } from './HomeCommunity.role'

/**
 * @DCI-Context
 * Context for adding community to DB
 * using roles to distinct between foreign and home communities
 */
export class AddCommunityContext {
  private communityRole: CommunityRole
  private iotaTopic: string
  public constructor(private communityDraft: CommunityDraft, iotaTopic?: string) {
    if (!iotaTopic) {
      this.iotaTopic = iotaTopicFromCommunityUUID(this.communityDraft.uuid)
    } else {
      this.iotaTopic = iotaTopic
    }
    this.communityRole = communityDraft.foreign
      ? new ForeignCommunityRole()
      : new HomeCommunityRole()
  }

  public async run(): Promise<void> {
    await this.communityRole.create(this.communityDraft, this.iotaTopic)
    await this.communityRole.store()
  }
}
