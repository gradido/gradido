import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { uuid4ToBuffer } from '@/utils'
import { Community } from '@entity/Community'
import { DataSource } from '@typeorm/DataSource'
import { crypto_generichash as cryptoHash } from 'sodium-native'
import { KeyManager } from './KeyManager'
import { createCommunitySpecialAccounts } from './Account'
import { KeyPair } from '@/model/KeyPair'

export const iotaTopicFromCommunityUUID = (communityUUID: string): string => {
  const hash = Buffer.alloc(32)
  cryptoHash(hash, uuid4ToBuffer(communityUUID))
  return hash.toString('hex')
}

export const isExist = async (community: CommunityDraft | string): Promise<boolean> => {
  const iotaTopic =
    community instanceof CommunityDraft ? iotaTopicFromCommunityUUID(community.uuid) : community
  const result = await DataSource.manager.find(Community, {
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

export const getAllTopics = async (): Promise<string[]> => {
  const communities = await DataSource.manager.find(Community, { select: { iotaTopic: true } })
  return communities.map((community) => community.iotaTopic)
}

export const loadHomeCommunityKeyPair = async (): Promise<KeyPair> => {
  const community = await DataSource.manager.findOneOrFail(Community, {
    where: { foreign: false },
    select: { rootChaincode: true, rootPubkey: true, rootPrivkey: true },
  })
  if (!community.rootChaincode || !community.rootPrivkey) {
    throw new Error('Missing chaincode or private key for home community')
  }
  return new KeyPair(community)
}
