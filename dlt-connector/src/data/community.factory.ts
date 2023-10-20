import { KeyManager } from '@/controller/KeyManager'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { Community } from '@entity/Community'
import { createAufAccount, createGmwAccount } from './account.factory'

export const createCommunity = (communityDraft: CommunityDraft, topic?: string): Community => {
  const communityEntity = Community.create()
  communityEntity.iotaTopic = topic ?? iotaTopicFromCommunityUUID(communityDraft.uuid)
  communityEntity.createdAt = new Date(communityDraft.createdAt)
  communityEntity.foreign = communityDraft.foreign
  return communityEntity
}

export const createHomeCommunity = (communityDraft: CommunityDraft, topic?: string): Community => {
  // create community entity
  const community = createCommunity(communityDraft, topic)

  // generate key pair for signing transactions and deriving all keys for community
  const keyPair = KeyManager.generateKeyPair()
  community.rootPubkey = keyPair.publicKey
  community.rootPrivkey = keyPair.privateKey
  community.rootChaincode = keyPair.chainCode
  // we should only have one home community per server
  KeyManager.getInstance().setHomeCommunityKeyPair(keyPair)

  // create auf account and gmw account
  community.aufAccount = createAufAccount(keyPair, community.createdAt)
  community.gmwAccount = createGmwAccount(keyPair, community.createdAt)
  return community
}
