import {
  CommunitiesSelect,
  communitiesTable,
  dbFindCommunityByUuid,
  drizzleDb,
  getHomeCommunityDrizzle,
} from 'database'
import { asc, isNotNull } from 'drizzle-orm'
import { CommunityIdentifier } from 'shared'

/**
 * The community uuid a member reference is meant for.
 *
 * The wallet passes on what the booking or the contact row gave it, and that is always a
 * uuid -- the server hands out no member without one. The member ref inputs still declare
 * the field nullable, though, and this is the one reading of a null they get: THIS
 * community, the only one a member could ever have been without a uuid in.
 */
export async function resolveCommunityUuid(
  communityUuid: string | null | undefined,
): Promise<string> {
  if (communityUuid) {
    return communityUuid
  }
  return (await getHomeCommunityDrizzle()).communityUuid
}

/**
 * Whether the identifier (uuid, url, name or public key) names this community. Asked of the
 * cached home community, without regard to case, as the database compared it.
 */
export async function isHomeCommunity(communityIdentifier: CommunityIdentifier): Promise<boolean> {
  const homeCom = await getHomeCommunityDrizzle()
  if (typeof communityIdentifier === 'string') {
    const lowerCommunityIdentifier = communityIdentifier.toLowerCase()
    return (
      homeCom.communityUuid.toLowerCase() === lowerCommunityIdentifier ||
      homeCom.url.toLowerCase() === lowerCommunityIdentifier ||
      homeCom.name?.toLowerCase() === lowerCommunityIdentifier
    )
  }
  return homeCom.publicKey.equals(communityIdentifier)
}

/**
 * Retrieves the name of the community with the given uuid.
 * @param communityUuid The uuid of the community.
 * @returns A promise that resolves to the name of the community. If the community does not exist or has no name,
 *          an empty string is returned.
 */
export async function getCommunityName(communityUuid: string): Promise<string> {
  const homeCom = await getHomeCommunityDrizzle()
  if (homeCom.communityUuid.toLowerCase() === communityUuid.toLowerCase()) {
    return homeCom.name ?? ''
  }
  return (await dbFindCommunityByUuid(communityUuid))?.name ?? ''
}

export async function getAuthenticatedCommunities(): Promise<CommunitiesSelect[]> {
  return await drizzleDb()
    .select()
    .from(communitiesTable)
    .where(isNotNull(communitiesTable.communityUuid))
    .orderBy(asc(communitiesTable.name))
}
