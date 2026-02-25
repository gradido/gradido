import { Ed25519PublicKey, urlSchema, uuidv4Schema } from 'shared'
import { FindOptionsOrder, FindOptionsWhere, IsNull, MoreThanOrEqual, Not } from 'typeorm'
import { Community as DbCommunity } from '../entity'

/**
 * Retrieves the home community, i.e., a community that is not foreign.
 * @returns A promise that resolves to the home community, or null if no home community was found
 */
export async function getHomeCommunity(): Promise<DbCommunity | null> {
  // TODO: Put in Cache, it is needed nearly always
  // TODO: return only DbCommunity or throw to reduce unnecessary checks, because there should be always a home community
  return await DbCommunity.findOne({
    where: { foreign: false },
  })
}

export async function getHomeCommunityWithFederatedCommunityOrFail(
  apiVersion: string,
): Promise<DbCommunity> {
  return await DbCommunity.findOneOrFail({
    where: { foreign: false, federatedCommunities: { apiVersion } },
    relations: { federatedCommunities: true },
  })
}

export async function getCommunityByUuid(communityUuid: string): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: [{ communityUuid }],
  })
}

export function findWithCommunityIdentifier(
  communityIdentifier: string,
): FindOptionsWhere<DbCommunity> {
  const where: FindOptionsWhere<DbCommunity> = {}
  // pre filter identifier type to reduce db query complexity
  if (urlSchema.safeParse(communityIdentifier).success) {
    where.url = communityIdentifier
  } else if (uuidv4Schema.safeParse(communityIdentifier).success) {
    where.communityUuid = communityIdentifier
  } else {
    where.name = communityIdentifier
  }
  return where
}

export async function getCommunityWithFederatedCommunityByIdentifier(
  communityIdentifier: string,
): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: { ...findWithCommunityIdentifier(communityIdentifier) },
    relations: ['federatedCommunities'],
  })
}

export async function getCommunityWithFederatedCommunityWithApiOrFail(
  publicKey: Ed25519PublicKey,
  apiVersion: string,
): Promise<DbCommunity> {
  return await DbCommunity.findOneOrFail({
    where: { foreign: true, publicKey: publicKey.asBuffer(), federatedCommunities: { apiVersion } },
    relations: { federatedCommunities: true },
  })
}

export async function getCommunityByPublicKeyOrFail(
  publicKey: Ed25519PublicKey,
): Promise<DbCommunity> {
  return await DbCommunity.findOneOrFail({
    where: { publicKey: publicKey.asBuffer() },
  })
}

// returns all reachable communities
// home community and all federated communities which have been verified within the last authenticationTimeoutMs
export async function getReachableCommunities(
  authenticationTimeoutMs: number,
  order?: FindOptionsOrder<DbCommunity>,
): Promise<DbCommunity[]> {
  return await DbCommunity.find({
    where: [
      {
        authenticatedAt: Not(IsNull()),
        federatedCommunities: {
          verifiedAt: MoreThanOrEqual(new Date(Date.now() - authenticationTimeoutMs)),
        },
      }, // or
      { foreign: false },
    ],
    order,
  })
}

export async function getNotReachableCommunities(
  order?: FindOptionsOrder<DbCommunity>,
): Promise<DbCommunity[]> {
  return await DbCommunity.find({
    where: { authenticatedAt: IsNull(), foreign: true },
    order,
  })
}

// return the home community and all communities which had at least once make it through the first handshake
export async function getAuthorizedCommunities(
  order?: FindOptionsOrder<DbCommunity>,
): Promise<DbCommunity[]>
{
  return await DbCommunity.find({
    where: [
      { authenticatedAt: Not(IsNull()) }, // or
      { foreign: false }
    ], 
    order
  })
}