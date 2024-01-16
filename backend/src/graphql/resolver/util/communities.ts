import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { Paginated } from '@arg/Paginated'

import { LogError } from '@/server/LogError'
import { Connection } from '@/typeorm/connection'

export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  const homeCommunity = await DbCommunity.findOne({
    where: [
      { foreign: false, communityUuid: communityIdentifier },
      { foreign: false, name: communityIdentifier },
      { foreign: false, url: communityIdentifier },
    ],
  })
  if (homeCommunity) {
    return true
  } else {
    return false
  }
}

export async function getHomeCommunity(): Promise<DbCommunity> {
  return await DbCommunity.findOneOrFail({
    where: [{ foreign: false }],
  })
}

export async function getCommunityUrl(communityIdentifier: string): Promise<string> {
  const community = await DbCommunity.findOneOrFail({
    where: [
      { communityUuid: communityIdentifier },
      { name: communityIdentifier },
      { url: communityIdentifier },
    ],
  })
  return community.url
}

export async function isCommunityAuthenticated(communityIdentifier: string): Promise<boolean> {
  const community = await DbCommunity.findOne({
    where: [
      { communityUuid: communityIdentifier },
      { name: communityIdentifier },
      { url: communityIdentifier },
    ],
  })
  if (community?.authenticatedAt) {
    return true
  } else {
    return false
  }
}

export async function getCommunityName(communityIdentifier: string): Promise<string> {
  const community = await DbCommunity.findOne({
    where: [{ communityUuid: communityIdentifier }, { url: communityIdentifier }],
  })
  if (community?.name) {
    return community.name
  } else {
    return ''
  }
}

export async function getCommunityByUuid(communityUuid: string): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: [{ communityUuid }],
  })
}

/**
 * Simulate RIGHT Join between Communities and Federated Communities
 * select *
 * Community as c
 * RIGHT JOIN FederatedCommunity as f
 * ON(c.public_key = f.public_key)
 * Typeorm don't has right joins
 * @returns
 */
export async function getAllCommunities({
  pageSize = 25,
  currentPage = 1,
}: Paginated): Promise<DbCommunity[]> {
  const connection = await Connection.getInstance()
  if (!connection) {
    throw new LogError('Cannot connect to db')
  }
  // foreign: 'ASC',
  // createdAt: 'DESC',
  // lastAnnouncedAt: 'DESC',
  const result = await connection
    .getRepository(DbFederatedCommunity)
    .createQueryBuilder('federatedCommunity')
    .leftJoinAndSelect('federatedCommunity.community', 'community')
    .orderBy('federatedCommunity.foreign', 'ASC')
    .addOrderBy('federatedCommunity.createdAt', 'DESC')
    .addOrderBy('federatedCommunity.lastAnnouncedAt', 'DESC')
    .skip((currentPage - 1) * pageSize * 3)
    .take(pageSize * 3)
    .getManyAndCount()
  const communityMap = new Map<string, DbCommunity>()
  result[0].forEach((value: DbFederatedCommunity) => {
    const publicKeyHex = value.publicKey.toString('hex')
    if (!communityMap.has(value.publicKey.toString('hex'))) {
      let community: DbCommunity = DbCommunity.create()
      if (value.community) {
        community = value.community
      }
      if (!community.federatedCommunities) {
        community.federatedCommunities = []
      }
      communityMap.set(publicKeyHex, community)
    }
    const community = communityMap.get(publicKeyHex)
    if (!community?.federatedCommunities) {
      throw new LogError('missing community after set it into map', publicKeyHex)
    }
    community.federatedCommunities.push(value)
  })
  return Array.from(communityMap.values())
}
