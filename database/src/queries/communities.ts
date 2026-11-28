import { and, asc, count, desc, eq, gte, isNotNull, or } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import {
  CachedValue,
  CommunityIdentifier,
  HomeCommunityInsertInput,
  HomeCommunityUpdateInput,
  homeCommunityInsertSchema,
  homeCommunityUpdateSchema,
  MissingHomeCommunityError,
  Uuidv4,
  uuidv4Schema,
  VoidResult,
} from 'shared'
import * as v from 'valibot'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { eqCommunityIdentifier } from '../data'
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
export async function dbSelectHomeCommunity(
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<CommunitiesSelect | null> {
  const resultRows = await tx
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
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  if (await dbSelectHomeCommunity(tx)) {
    throw new Error('home community already exist, only one is allowed')
  }
  await tx.insert(communitiesTable).values(v.parse(homeCommunityInsertSchema, homeCommunity))
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

/**
 * Replaces the signing key pair of the home community. Only for the one-time move of the
 * dht-node from a FEDERATION_DHT_SEED used as fill string to the hex-decoded one; apart from it
 * the keys never change, see homeCommunityUpdateSchema.
 * TODO: remove once every community has started once with the decoded seed
 */
export async function dbReplaceHomeCommunitySigningKeys(
  publicKey: Buffer,
  privateKey: Buffer,
): Promise<void> {
  const keys = v.parse(
    v.object({
      publicKey: homeCommunityInsertSchema.entries.publicKey,
      privateKey: homeCommunityInsertSchema.entries.privateKey,
    }),
    { publicKey, privateKey },
  )
  const result = await drizzleDb()
    .update(communitiesTable)
    .set({ ...keys, updatedAt: new Date() })
    .where(eq(communitiesTable.foreign, false))
  homeCommunityCache.invalidateEverywhere()
  if (!result[0].affectedRows) {
    throw new MissingHomeCommunityError()
  }
}

export async function dbFindCommunityByUuid(
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

/**
 * Whether members of the home community file support requests in the wallet (K5, SUA-019).
 *
 * Read through the cached home community, as dbIsMatchingKeyingActive: a switch is seen in this
 * process on the next call, in the others once the Redis message arrives, else after
 * `DEFAULT_CACHE_TIMEOUT_MS`. Throws where there is no home community, or where the reading fails.
 */
export async function dbIsSupportTicketsActive(): Promise<boolean> {
  const homeCom = await getHomeCommunityDrizzle()
  return homeCom.supportTicketsActive
}

// the foreign community with this uuid, null where there is none
export async function dbFindForeignCommunityByUuid(
  communityUuid: Uuidv4,
): Promise<CommunitiesSelect | null> {
  const resultRows = await drizzleDb()
    .select()
    .from(communitiesTable)
    .where(
      and(eq(communitiesTable.communityUuid, communityUuid), eq(communitiesTable.foreign, true)),
    )
  return resultRows[0] ?? null
}

export async function dbFindAuthenticatedForeignCommunityByIdentifier(
  communityIdentifier: CommunityIdentifier,
): Promise<CommunitiesSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(communitiesTable)
    .where(
      and(
        eq(communitiesTable.foreign, true),
        eqCommunityIdentifier(communityIdentifier),
        isNotNull(communitiesTable.authenticatedAt),
      ),
    )
  return rows[0] ?? null
}

// the foreign community a signed request names with its public key, null for an unknown key
export async function dbFindForeignCommunityByPublicKey(
  publicKey: Buffer,
): Promise<CommunitiesSelect | null> {
  const resultRows = await drizzleDb()
    .select()
    .from(communitiesTable)
    .where(and(eq(communitiesTable.publicKey, publicKey), eq(communitiesTable.foreign, true)))
  return resultRows[0] ?? null
}

/**
 * The other communities this one may ask about their members' pictures: foreign and through
 * the authentication handshake -- the other side refuses any other, so asking it would only
 * cost the time limit. The same condition the relay asks by
 * (dbFindAuthenticatedForeignCommunityByIdentifier).
 */
export async function dbSelectAuthenticatedForeignCommunities(): Promise<CommunitiesSelect[]> {
  return drizzleDb()
    .select()
    .from(communitiesTable)
    .where(and(eq(communitiesTable.foreign, true), isNotNull(communitiesTable.authenticatedAt)))
    .orderBy(communitiesTable.id)
}

/**
 * The home community and every foreign one through the handshake that answered its community
 * infos correctly within the last `authenticationTimeoutMs`.
 */
export async function dbSelectReachableCommunities(
  authenticationTimeoutMs: number,
): Promise<CommunitiesSelect[]> {
  return drizzleDb()
    .select()
    .from(communitiesTable)
    .where(
      or(
        eq(communitiesTable.foreign, false),
        and(
          isNotNull(communitiesTable.authenticatedAt),
          gte(communitiesTable.verifiedAt, new Date(Date.now() - authenticationTimeoutMs)),
        ),
      ),
    )
    .orderBy(asc(communitiesTable.foreign), asc(communitiesTable.name))
}

/**
 * A page of every community, the home community first, then the newest, and how many there are
 * in all. Of those created at the same moment, the one inserted last comes first.
 */
export async function dbSelectCommunities({
  pageSize = 25,
  currentPage = 1,
}: {
  pageSize?: number
  currentPage?: number
} = {}): Promise<{ count: number; communities: CommunitiesSelect[] }> {
  const [[total], communities] = await Promise.all([
    drizzleDb().select({ count: count() }).from(communitiesTable),
    drizzleDb()
      .select()
      .from(communitiesTable)
      // the id last: rows created in the same millisecond keep one order across the pages
      .orderBy(
        asc(communitiesTable.foreign),
        desc(communitiesTable.createdAt),
        desc(communitiesTable.id),
      )
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize),
  ])
  return { count: total.count, communities }
}

// the home community and every community that made it through the handshake at least once
export async function dbSelectAuthorizedCommunities(): Promise<CommunitiesSelect[]> {
  return drizzleDb()
    .select()
    .from(communitiesTable)
    .where(or(eq(communitiesTable.foreign, false), isNotNull(communitiesTable.authenticatedAt)))
    .orderBy(asc(communitiesTable.foreign), asc(communitiesTable.name))
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

export async function dbDeleteForeignCommunity(id: number): Promise<void> {
  await drizzleDb()
    .delete(communitiesTable)
    .where(and(eq(communitiesTable.id, id), eq(communitiesTable.foreign, true)))
}
