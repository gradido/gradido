import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { Community } from '@entity/Community'

export const isExist = async (community: CommunityDraft | string): Promise<boolean> => {
  const iotaTopic =
    community instanceof CommunityDraft ? iotaTopicFromCommunityUUID(community.uuid) : community
  const result = await Community.find({
    where: { iotaTopic },
  })
  return result.length > 0
}

export const create = (community: CommunityDraft, topic?: string): Community => {
  const communityEntity = Community.create()
  communityEntity.iotaTopic = topic ?? iotaTopicFromCommunityUUID(community.uuid)
  communityEntity.createdAt = new Date(community.createdAt)
  communityEntity.foreign = community.foreign
  if (!community.foreign) {
    // TODO: generate keys
  }
  return communityEntity
}

export const getAllTopics = async (): Promise<string[]> => {
  const communities = await Community.find({ select: { iotaTopic: true } })
  return communities.map((community) => community.iotaTopic)
}
