import { FindOneOptions } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'

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
 * Retrieves the home community, i.e., a community that is not foreign.
 * @returns A promise that resolves to the home community, or throw if no home community was found
 */
export async function getHomeCommunity(): Promise<DbCommunity> {
  return await DbCommunity.findOneOrFail({
    where: [{ foreign: false }],
  })
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

export async function getCommunityByIdentifier(
  communityIdentifier: string,
): Promise<DbCommunity | null> {
  return await DbCommunity.findOne(findWithCommunityIdentifier(communityIdentifier))
}
