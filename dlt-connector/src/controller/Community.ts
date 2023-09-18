import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { getDataSource } from '@typeorm/DataSource'
import { KeyManager } from './KeyManager'
import { createCommunitySpecialAccounts } from './Account'
import { KeyPair } from '@/model/KeyPair'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { CommunityArg } from '@/graphql/arg/CommunityArg'
import { IsNull, Not } from 'typeorm'

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
    KeyManager.getInstance().generateKeysForCommunity(communityEntity)
    createCommunitySpecialAccounts(communityEntity)
  }
  return communityEntity
}

export const find = async ({ uuid, foreign, confirmed }: CommunityArg): Promise<Community[]> => {
  return await getDataSource().manager.find(Community, {
    where: {
      ...(uuid && { iotaTopic: iotaTopicFromCommunityUUID(uuid) }),
      ...(foreign && { foreign }),
      ...(confirmed && { confirmedAt: Not(IsNull()) }),
    },
  })
}

export const getAllTopics = async (): Promise<string[]> => {
  const communities = await getDataSource().manager.find(Community, { select: { iotaTopic: true } })
  return communities.map((community) => community.iotaTopic)
}

export const loadHomeCommunityKeyPair = async (): Promise<KeyPair> => {
  const community = await getDataSource().manager.findOneOrFail(Community, {
    where: { foreign: false },
    select: { rootChaincode: true, rootPubkey: true, rootPrivkey: true },
  })
  if (!community.rootChaincode || !community.rootPrivkey) {
    throw new Error('Missing chaincode or private key for home community')
  }
  return new KeyPair(community)
}
