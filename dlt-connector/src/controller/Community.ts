import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { uuid4ToBuffer } from '@/utils'
import { Community } from '@entity/Community'
import { getDataSource } from '@typeorm/DataSource'
import { crypto_generichash as cryptoHash } from 'sodium-native'

export const iotaTopicFromCommunityUUID = (communityUUID: string): string => {
  const hash = Buffer.alloc(32)
  cryptoHash(hash, uuid4ToBuffer(communityUUID))
  return hash.toString('hex')
}

export const isExist = async (community: CommunityDraft | string): Promise<boolean> => {
  const iotaTopic =
    community instanceof CommunityDraft ? iotaTopicFromCommunityUUID(community.uuid) : community
  const result = await getDataSource().manager.find(Community, {
    where: { iotaTopic },
  })
  return result.length > 0
}

export const create = (community: CommunityDraft, topic?: string): Community => {
  const communityEntity = new Community()
  communityEntity.iotaTopic = topic ?? iotaTopicFromCommunityUUID(community.uuid)
  communityEntity.createdAt = new Date(community.createdAt)
  communityEntity.foreign = community.foreign
  if (!community.foreign) {
    // TODO: generate keys
  }
  return communityEntity
}

export const getAllTopics = async (): Promise<string[]> => {
  const communities = await getDataSource().manager.find(Community, { select: { iotaTopic: true } })
  return communities.map((community) => community.iotaTopic)
}
