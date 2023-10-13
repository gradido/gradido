import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { KeyManager } from './KeyManager'
import { createCommunitySpecialAccounts } from './Account'
import { KeyPair } from '@/model/KeyPair'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { CommunityArg } from '@/graphql/arg/CommunityArg'
import { FindOptionsSelect, In, IsNull, Not } from 'typeorm'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionsManager } from './TransactionsManager'
import { getDataSource } from '@/typeorm/DataSource'
import { LogError } from '@/server/LogError'
import { Account } from '@entity/Account'

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
    KeyManager.getInstance().generateKeysForCommunity(communityEntity)
    createCommunitySpecialAccounts(communityEntity)
  }
  return communityEntity
}

export const find = async ({ uuid, foreign, confirmed }: CommunityArg): Promise<Community[]> => {
  return await Community.find({
    where: {
      ...(uuid && { iotaTopic: iotaTopicFromCommunityUUID(uuid) }),
      ...(foreign && { foreign }),
      ...(confirmed && { confirmedAt: Not(IsNull()) }),
    },
  })
}

export const findByCommunityUuid = async (communityUuid: string): Promise<Community | null> => {
  return await Community.findOneBy({ iotaTopic: iotaTopicFromCommunityUUID(communityUuid) })
}

export const findByIotaTopic = async (iotaTopic: string): Promise<Community | null> => {
  return await Community.findOneBy({ iotaTopic })
}

export const findCommunitiesByTopics = (topics: string[]): Promise<Community[]> => {
  return Community.findBy({ iotaTopic: In(topics) })
}

export const getCommunityForUserIdentifier = async (
  identifier: UserIdentifier,
): Promise<Community | undefined> => {
  const topic = identifier.communityUuid
    ? iotaTopicFromCommunityUUID(identifier.communityUuid)
    : TransactionsManager.getInstance().getHomeCommunityTopic()
  return (await Community.findOneBy({ iotaTopic: topic })) ?? undefined
}

export const findAll = (select: FindOptionsSelect<Community>): Promise<Community[]> => {
  return Community.find({ select })
}

export const confirm = async (iotaTopic: string, confirmedAt: Date): Promise<boolean> => {
  const query = `
    UPDATE communities c
    LEFT JOIN accounts gmw ON c.gmw_account_id = gmw.id
    LEFT JOIN accounts auf ON c.auf_account_id = auf.id
    SET c.confirmed_at = ?,
        gmw.confirmed_at = ?,
        auf.confirmed_at = ?
    WHERE c.iota_topic = ?
  `

  const entityManager = Community.getRepository().manager // getDataSource().manager
  const result = await entityManager.query(query, [
    confirmedAt,
    confirmedAt,
    confirmedAt,
    iotaTopic,
  ])

  if (result.affected && result.affected > 1) {
    throw new LogError('more than one community matched by topic: %s', iotaTopic)
  }
  return result.affected === 1
}

export const loadHomeCommunityKeyPair = async (): Promise<KeyPair> => {
  const community = await Community.findOneOrFail({
    where: { foreign: false },
    select: { rootChaincode: true, rootPubkey: true, rootPrivkey: true },
  })
  if (!community.rootChaincode || !community.rootPrivkey) {
    throw new Error('Missing chaincode or private key for home community')
  }
  return new KeyPair(community)
}
