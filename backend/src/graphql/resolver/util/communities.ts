import { Paginated } from '@arg/Paginated'
import {
  AppDatabase,
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
} from 'database'
import { FindOneOptions, IsNull, Not } from 'typeorm'

import { LogError } from '@/server/LogError'

function findWithCommunityIdentifier(communityIdentifier: string): FindOneOptions<DbCommunity> {
  return {
    where: [
      { communityUuid: communityIdentifier },
      { name: communityIdentifier },
      { url: communityIdentifier },
    ],
  }
}

/**
 * Checks if a community with the given identifier exists and is not foreign.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to true if a non-foreign community exists with the given identifier, otherwise false.
 */
export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  // The !! operator in JavaScript or TypeScript is a shorthand for converting a value to a boolean.
  // It essentially converts any truthy value to true and any falsy value to false.
  return !!(await DbCommunity.findOne({
    where: [
      { foreign: false, communityUuid: communityIdentifier },
      { foreign: false, name: communityIdentifier },
      { foreign: false, url: communityIdentifier },
    ],
  }))
}

/**
 * TODO: Check if it is needed, because currently it isn't used at all
 * Retrieves the URL of the community with the given identifier.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to the URL of the community or throw if no community with this identifier was found
 */
export async function getCommunityUrl(communityIdentifier: string): Promise<string> {
  return (await DbCommunity.findOneOrFail(findWithCommunityIdentifier(communityIdentifier))).url
}

/**
 * TODO: Check if it is needed, because currently it isn't used at all
 * Checks if a community with the given identifier exists and has an authenticatedAt property set.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to true if a community with an authenticatedAt property exists with the given identifier,
 *          otherwise false.
 */
export async function isCommunityAuthenticated(communityIdentifier: string): Promise<boolean> {
  // The !! operator in JavaScript or TypeScript is a shorthand for converting a value to a boolean.
  // It essentially converts any truthy value to true and any falsy value to false.
  return !!(await DbCommunity.findOne(findWithCommunityIdentifier(communityIdentifier)))
    ?.authenticatedAt
}

/**
 * Retrieves the name of the community with the given identifier.
 * @param communityIdentifier The identifier (URL, UUID) of the community.
 * @returns A promise that resolves to the name of the community. If the community does not exist or has no name,
 *          an empty string is returned.
 */
export async function getCommunityName(communityIdentifier: string): Promise<string> {
  const community = await DbCommunity.findOne({
    where: [{ communityUuid: communityIdentifier }, { url: communityIdentifier }],
  })

  return community?.name ? community.name : ''
}
export async function getCommunityByUuid(communityUuid: string): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: [{ communityUuid }],
  })
}
export async function getCommunityByPublicKey(publicKey: Buffer): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: [{ publicKey: publicKey }],
  })
}

export async function getAuthenticatedCommunities(): Promise<DbCommunity[]> {
  const dbCommunities: DbCommunity[] = await DbCommunity.find({
    where: { communityUuid: Not(IsNull()) }, //, authenticatedAt: Not(IsNull()) },
    order: {
      name: 'ASC',
    },
  })
  return dbCommunities
}

export async function getCommunityByIdentifier(
  communityIdentifier: string,
): Promise<DbCommunity | null> {
  return await DbCommunity.findOne(findWithCommunityIdentifier(communityIdentifier))
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
  const connection = AppDatabase.getInstance()
  if (!connection.isConnected()) {
    throw new LogError('Cannot connect to db')
  }
  // foreign: 'ASC',
  // createdAt: 'DESC',
  // lastAnnouncedAt: 'DESC',
  const result = await connection
    .getDataSource()
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
