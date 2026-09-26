import { eq } from 'drizzle-orm'
import {
  CachedValue,
  Ed25519PublicKey,
  HomeCommunityInsertInput,
  homeCommunityInsertSchema,
  MissingHomeCommunityError,
  urlSchema,
  uuidv4Schema,
} from 'shared'
import { FindOptionsOrder, FindOptionsWhere, IsNull, MoreThanOrEqual, Not } from 'typeorm'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { Community as DbCommunity } from '../entity'
import { CommunitiesInsert, CommunitiesSelect, communitiesTable } from '../schemas'

/** Announces a change of the home community row, see `AppDatabase.publish()`. */
export const HOME_COMMUNITY_CHANGED_CHANNEL = 'home_community_changed'

// Shared between processes: the dht-node rewrites the row at startup, backend and federation
// each hold their own cached copy.
const homeCommunityCache = new CachedValue(
  async () => {
    const homeCom = await dbSelectHomeCommunity()
    if (!homeCom) {
      throw new MissingHomeCommunityError()
    }
    return homeCom
  },
  // a getter, because AppDatabase and the queries import each other
  { shared: { channel: HOME_COMMUNITY_CHANGED_CHANNEL, pubSub: () => AppDatabase.getInstance() } },
)

/**
 * Retrieves the home community, i.e., a community that is not foreign.
 * @returns A promise that resolves to the home community, or null if no home community was found
 */
export async function getHomeCommunity(): Promise<DbCommunity | null> {
  // TODO: Put in Cache, it is needed nearly always, but needs updating tests
  // TODO: return only DbCommunity or throw to reduce unnecessary checks, because there should be always a home community
  return await DbCommunity.findOne({
    where: { foreign: false },
  })
}

/**
 * The home community, cached. Invalidated by every write through dbInsertHomeCommunity or
 * dbUpdateHomeCommunity, in any process; a write that bypasses both is seen once the cache
 * has timed out (DEFAULT_CACHE_TIMEOUT_MS).
 * @throws MissingHomeCommunityError if there is none
 */
export async function getHomeCommunityDrizzle(): Promise<CommunitiesSelect> {
  return await homeCommunityCache.get()
}

/**
 * The home community as it is in the database right now, bypassing the cache.
 * For whoever writes the row and must not decide on a stale copy of it.
 */
export async function dbSelectHomeCommunity(): Promise<CommunitiesSelect | null> {
  const resultRows = await drizzleDb()
    .select()
    .from(communitiesTable)
    .where(eq(communitiesTable.foreign, false))
  return resultRows[0] ?? null
}

export async function dbInsertHomeCommunity(
  homeCommunity: HomeCommunityInsertInput,
): Promise<void> {
  if (await dbSelectHomeCommunity()) {
    throw new Error('home community already exist, only one is allowed')
  }
  await drizzleDb().insert(communitiesTable).values(homeCommunityInsertSchema.parse(homeCommunity))
  homeCommunityCache.invalidateEverywhere()
}

export async function dbUpdateHomeCommunity(values: Partial<CommunitiesInsert>): Promise<void> {
  // updatedAt: the TypeORM entity sets it via @UpdateDateColumn, the column itself has no ON UPDATE
  const result = await drizzleDb()
    .update(communitiesTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(communitiesTable.foreign, false))
  homeCommunityCache.invalidateEverywhere()
  if (!result[0].affectedRows) {
    throw new MissingHomeCommunityError()
  }
}

export async function dbGetCommunityByUuid(
  communityUuid: string,
): Promise<CommunitiesSelect | null> {
  const resultRows = await drizzleDb()
    .select()
    .from(communitiesTable)
    .where(eq(communitiesTable.communityUuid, communityUuid))
  return resultRows[0] ?? null
}

/**
 * Whether the home community pays a language model to key its matching entries.
 *
 * Read through the cached home community: `dbUpdateHomeCommunity` invalidates the cache in
 * every process, so a switch is seen on the next call. Should that message get lost, after
 * `DEFAULT_CACHE_TIMEOUT_MS` at the latest.
 */
export async function dbIsMatchingKeyingActive(): Promise<boolean> {
  const homeCom = await getHomeCommunityDrizzle()
  return homeCom.matchingKeyingActive
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

/**
 * The other communities this one may ask about their members' pictures: foreign, through the
 * authentication handshake, with a JWT key to seal the question for, and a uuid to file the
 * answers under. The same condition the relay checks before it asks
 * (backend UserResolver relayMemberAvatars) -- the other side refuses a community that has
 * not completed the handshake with it, so asking any other would only cost the time limit.
 *
 * TypeORM, like its neighbours here: the caller hands each row to `xcomMemberAvatars`, which
 * takes the entity.
 */
export async function dbSelectAuthenticatedForeignCommunities(): Promise<DbCommunity[]> {
  return await DbCommunity.find({
    where: {
      foreign: true,
      authenticatedAt: Not(IsNull()),
      publicJwtKey: Not(IsNull()),
      communityUuid: Not(IsNull()),
    },
    order: { id: 'ASC' },
  })
}

// return the home community and all communities which had at least once make it through the first handshake
export async function getAuthorizedCommunities(
  order?: FindOptionsOrder<DbCommunity>,
): Promise<DbCommunity[]> {
  return await DbCommunity.find({
    where: [
      { authenticatedAt: Not(IsNull()) }, // or
      { foreign: false },
    ],
    order,
  })
}
