import { FindOptionsWhere } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { isURL } from 'class-validator'

import { LogError } from '@/server/LogError'
import { isUUID4 } from '@/util/validate'

function getCommunityFindOptions(
  communityIdentifier?: string | boolean | null,
  foreign?: boolean | null,
): FindOptionsWhere<DbCommunity> {
  if (communityIdentifier === undefined && foreign === undefined) {
    throw new LogError('one of communityIdentifier or foreign must be set')
  }

  const where: FindOptionsWhere<DbCommunity> = {}
  // != null cover !== null and !== undefined
  if (communityIdentifier != null) {
    if (typeof communityIdentifier === 'boolean') {
      if (typeof foreign === 'boolean') {
        throw new LogError('communityIdentifier cannot be boolean if foreign is set separately ')
      }
      where.foreign = communityIdentifier
    } else if (isURL(communityIdentifier)) {
      where.url = communityIdentifier
    } else if (isUUID4(communityIdentifier)) {
      where.communityUuid = communityIdentifier
    }
  }

  if (typeof foreign === 'boolean') {
    where.foreign = foreign
  }
  return where
}

/**
 * Retrieves a community from the database based on the provided identifier and foreign status.
 * If communityIdentifier is a string, it can represent either the URL, UUID, or name of the community.
 * If communityIdentifier is a boolean, it represents the foreign status of the community.
 * If foreign is provided separately and is a boolean, it represents the foreign status of the community.
 * communityIdentifier and foreign cannot both be boolean
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community, or a boolean representing the foreign status.
 * @param foreign Optional. If provided and is a boolean, it represents the foreign status of the community.
 * @returns A promise that resolves to a DbCommunity object if found, or null if not found.
 */
export async function getCommunity(
  communityIdentifier?: string | boolean | null,
  foreign?: boolean | null,
): Promise<DbCommunity | null> {
  return DbCommunity.findOne({ where: getCommunityFindOptions(communityIdentifier, foreign) })
}

/**
 * Retrieves a community from the database based on the provided identifier and foreign status.
 * If communityIdentifier is a string, it can represent either the URL, UUID, or name of the community.
 * If communityIdentifier is a boolean, it represents the foreign status of the community.
 * If foreign is provided separately and is a boolean, it represents the foreign status of the community.
 * communityIdentifier and foreign cannot both be boolean
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community, or a boolean representing the foreign status.
 * @param foreign Optional. If provided and is a boolean, it represents the foreign status of the community.
 * @returns A promise that resolves to a DbCommunity object if found, or throw if not found.
 */
export async function getCommunityOrFail(
  communityIdentifier?: string | boolean | null,
  foreign?: boolean | null,
): Promise<DbCommunity> {
  return DbCommunity.findOneOrFail({
    where: getCommunityFindOptions(communityIdentifier, foreign),
  })
}

/**
 * Checks if a community with the given identifier exists and is not foreign.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to true if a non-foreign community exists with the given identifier, otherwise false.
 */
export async function isHomeCommunity(communityIdentifier: string): Promise<boolean> {
  return (await getCommunity(communityIdentifier, false)) !== null
}

/**
 * Retrieves the home community, i.e., a community that is not foreign.
 * @returns A promise that resolves to the home community, or throw if no home community was found
 */
export async function getHomeCommunity(): Promise<DbCommunity> {
  return getCommunityOrFail(false)
}

/**
 * Retrieves the URL of the community with the given identifier.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to the URL of the community or throw if no community with this identifier was found
 */
export async function getCommunityUrl(communityIdentifier: string): Promise<string> {
  return (await getCommunityOrFail(communityIdentifier)).url
}

/**
 * Checks if a community with the given identifier exists and has an authenticatedAt property set.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to true if a community with an authenticatedAt property exists with the given identifier, otherwise false.
 */
export async function isCommunityAuthenticated(communityIdentifier: string): Promise<boolean> {
  // The !! operator is used to convert the result to a boolean value.
  return !!(await getCommunity(communityIdentifier))?.authenticatedAt
}

/**
 * Retrieves the name of the community with the given identifier.
 * @param communityIdentifier The identifier (URL, UUID, or name) of the community.
 * @returns A promise that resolves to the name of the community. If the community does not exist or has no name, an empty string is returned.
 */
export async function getCommunityName(communityIdentifier: string): Promise<string> {
  return (await getCommunity(communityIdentifier))?.name ?? ''
}
