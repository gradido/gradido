import { FindOptionsWhere } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { isURL } from 'class-validator'

import { CommunityArgs } from '@/graphql/arg/CommunityArgs'
import { LogError } from '@/server/LogError'
import { isUUID4 } from '@/util/validate'

function getCommunityFindOptions({
  communityIdentifier,
  foreign,
}: CommunityArgs): FindOptionsWhere<DbCommunity> {
  if (communityIdentifier === undefined && foreign === undefined) {
    throw new LogError('one of communityIdentifier or foreign must be set')
  }

  const where: FindOptionsWhere<DbCommunity> = {}
  if (communityIdentifier != null) {
    if (isURL(communityIdentifier)) {
      where.url = communityIdentifier
    } else if (isUUID4(communityIdentifier)) {
      where.communityUuid = communityIdentifier
    } else {
      where.name = communityIdentifier
    }
  }

  if (typeof foreign === 'boolean') {
    where.foreign = foreign
  }
  return where
}

/**
 * Retrieves a community from the database based on the provided identifier and foreign status.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community
 * @param foreign Optional. If provided it represents the foreign status of the community.
 * @returns A promise that resolves to a DbCommunity object if found, or null if not found.
 */
export async function getCommunity(communityArgs: CommunityArgs): Promise<DbCommunity | null> {
  return DbCommunity.findOne({ where: getCommunityFindOptions(communityArgs) })
}

/**
 * Retrieves a community from the database based on the provided identifier and foreign status.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community
 * @param foreign Optional. If provided it represents the foreign status of the community.
 * @returns A promise that resolves to a DbCommunity object if found, or throw if not found.
 */
export async function getCommunityOrFail(communityArgs: CommunityArgs): Promise<DbCommunity> {
  return DbCommunity.findOneOrFail({
    where: getCommunityFindOptions(communityArgs),
  })
}

/**
 * Checks if a community with the given identifier exists and is not foreign.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to true if a non-foreign community exists with the given identifier, otherwise false.
 */
export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  return (await getCommunity({ communityIdentifier, foreign: false })) !== null
}

/**
 * Retrieves the home community, i.e., a community that is not foreign.
 * @returns A promise that resolves to the home community, or throw if no home community was found
 */
export async function getHomeCommunity(): Promise<DbCommunity> {
  return getCommunityOrFail({ foreign: false })
}

/**
 * Retrieves the URL of the community with the given identifier.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to the URL of the community or throw if no community with this identifier was found
 */
export async function getCommunityUrl(communityIdentifier: string): Promise<string> {
  return (await getCommunityOrFail({ communityIdentifier })).url
}

/**
 * Checks if a community with the given identifier exists and has an authenticatedAt property set.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to true if a community with an authenticatedAt property exists with the given identifier,
 *          otherwise false.
 */
export async function isCommunityAuthenticated(communityIdentifier: string): Promise<boolean> {
  // The !! operator is used to convert the result to a boolean value.
  return !!(await getCommunity({ communityIdentifier }))?.authenticatedAt
}

/**
 * Retrieves the name of the community with the given identifier.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to the name of the community. If the community does not exist or has no name,
 *          an empty string is returned.
 */
export async function getCommunityName(communityIdentifier: string): Promise<string> {
  return (await getCommunity({ communityIdentifier }))?.name ?? ''
}
