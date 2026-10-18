import { and, eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import {
  CachedValue,
  Ed25519PublicKey,
  HomeCommunityInsertInput,
  HomeCommunityUpdateInput,
  homeCommunityInsertSchema,
  homeCommunityUpdateSchema,
  MissingHomeCommunityError,
  Uuidv4,
  urlSchema,
  uuidv4Schema,
  VoidResult,
} from 'shared'
import { FindOptionsOrder, FindOptionsWhere, IsNull, MoreThanOrEqual, Not } from 'typeorm'
import * as v from 'valibot'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { Community as DbCommunity } from '../entity'
import { CommunityUniqueKey } from '../enum'
import { DBInsertFailed, DBUniqueKeyViolation, duplicateEntryKey } from '../errorTypes'
import { CommunitiesInsert, CommunitiesSelect, communitiesTable } from '../schemas'

/** Announces a change of the home community row, see `AppDatabase.publish()`. */
export const HOME_COMMUNITY_CHANGED_CHANNEL = 'home_community_changed'

// Shared between processes: the dht-node writes url, name and description at startup, the
// backend's admin the settings; backend and federation each hold their own cached copy.
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

/*
 * is called only at one place in production, besides the tests
 * when it is called on multiple places, it must be secured against two calls at the same time
 */
export async function dbInsertHomeCommunity(
  homeCommunity: HomeCommunityInsertInput,
): Promise<void> {
  if (await dbSelectHomeCommunity()) {
    throw new Error('home community already exist, only one is allowed')
  }
  await drizzleDb()
    .insert(communitiesTable)
    .values(v.parse(homeCommunityInsertSchema, homeCommunity))
  homeCommunityCache.invalidateEverywhere()
}

/**
 * Writes the fields homeCommunityUpdateSchema allows; any other field, a key above all, is
 * dropped by the parse.
 */
export async function dbUpdateHomeCommunity(values: HomeCommunityUpdateInput): Promise<void> {
  // updatedAt: the TypeORM entity sets it via @UpdateDateColumn, the column itself has no ON UPDATE
  const result = await drizzleDb()
    .update(communitiesTable)
    .set({ ...v.parse(homeCommunityUpdateSchema, values), updatedAt: new Date() })
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

export async function dbHomeCommunityGetUuid(): Promise<string> {
  const homeCom = await getHomeCommunityDrizzle()
  return v.parse(uuidv4Schema, homeCom?.communityUuid)
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
  if (v.safeParse(urlSchema, communityIdentifier).success) {
    where.url = communityIdentifier
  } else if (v.safeParse(uuidv4Schema, communityIdentifier).success) {
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

// return map with communityUuid as key
export async function dbFindForeignCommunitiesByUuid(
  communityUuids: Uuidv4[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<Map<string, CommunitiesSelect>> {
  const map = new Map<string, CommunitiesSelect>()
  if (!communityUuids.length) {
    return map
  }
  const rows = await tx
    .select()
    .from(communitiesTable)
    .where(
      and(
        inArray(communitiesTable.communityUuid, communityUuids),
        eq(communitiesTable.foreign, true),
      ),
    )
  for (const row of rows) {
    map.set(row.communityUuid, row)
  }
  return map
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

// the value a unique key refused, readable in a log
const uniqueValueOf = (uniqueKey: CommunityUniqueKey, community: CommunitiesInsert): string => {
  switch (uniqueKey) {
    case CommunityUniqueKey.COMMUNITY_UUID:
      return community.communityUuid
    case CommunityUniqueKey.PUBLIC_KEY:
      return community.publicKey.toString('hex')
    case CommunityUniqueKey.URL:
      return community.url
  }
}

/**
 * Inserts one foreign community. A uuid, public key or url another row has already comes back
 * as DBUniqueKeyViolation, its uniqueKey says which. In a transaction MariaDB takes back only
 * the refused statement, the transaction goes on.
 * @throws the driver error for every other failure, and for a unique key this function does
 *         not know - the schema then has one more than CommunityUniqueKey
 */
export async function dbInsertForeignCommunity(
  foreignCommunity: CommunitiesInsert,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<
  VoidResult<DBUniqueKeyViolation<CommunityUniqueKey> | DBInsertFailed<CommunitiesInsert>>
> {
  try {
    const rows = await tx.insert(communitiesTable).values(foreignCommunity)
    if (rows[0].affectedRows === 1) {
      return { success: true }
    }
  } catch (error) {
    const uniqueKey = Object.values(CommunityUniqueKey).find(
      (key) => key === duplicateEntryKey(error),
    )
    if (uniqueKey) {
      return {
        success: false,
        error: new DBUniqueKeyViolation(
          'communities',
          uniqueKey,
          uniqueValueOf(uniqueKey, foreignCommunity),
        ),
      }
    }
    throw error
  }
  return { success: false, error: new DBInsertFailed('communities', foreignCommunity) }
}

export async function dbUpdateForeignCommunity(
  id: number,
  foreignCommunity: Partial<CommunitiesInsert>,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<boolean> {
  const rows = await tx
    .update(communitiesTable)
    .set(foreignCommunity)
    .where(and(eq(communitiesTable.id, id), eq(communitiesTable.foreign, true)))
  return rows[0].affectedRows === 1
}
