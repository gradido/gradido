import { eq } from 'drizzle-orm'
import { Ed25519PublicKey, urlSchema, uuidv4Schema, VoidResult } from 'shared'
import { FindOptionsOrder, FindOptionsWhere, IsNull, MoreThanOrEqual, Not } from 'typeorm'
import { drizzleDb } from '../AppDatabase'
import { Community as DbCommunity } from '../entity'
import { DBNotFoundError } from '../errorTypes'
import { CommunitiesSelect, communitiesTable } from '../schemas'

const HomeCommunityNotFound = new DBNotFoundError('communities', 'foreign = 0')

// cheap cache
//let homeCommunityCache: DbCommunity | null = null
let homeCommunityDrizzleCache: CommunitiesSelect | null = null
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

export async function getHomeCommunityDrizzle(): Promise<CommunitiesSelect | null> {
  if (!homeCommunityDrizzleCache) {
    const resultRows = await drizzleDb()
      .select()
      .from(communitiesTable)
      .where(eq(communitiesTable.foreign, 0))
    if (resultRows[0]) {
      homeCommunityDrizzleCache = resultRows[0]
    }
  }
  return homeCommunityDrizzleCache
}

/**
 * Whether the home community pays a language model to key its matching entries.
 *
 * ⚠️ Read fresh on every call, and that is the whole reason this is its own function
 * rather than a field off `getHomeCommunityDrizzle`. That one caches the community for
 * the life of the process and never invalidates, so it would answer with whatever was
 * true when the process started - and a switch that only changes on restart is not a
 * switch. The keying run asks once per pass, which is a single indexed read against
 * one row, against a run that is about to spend money per entry.
 *
 * ⛔ Missing home community answers `false`, deliberately. "There is nobody to bill and
 * nobody who decided" is the same answer as "not switched on", and the alternative -
 * throwing - would turn a run that should quietly stay off into an error on a timer.
 */
export async function dbIsMatchingKeyingActive(): Promise<boolean> {
  const rows = await drizzleDb()
    .select({ active: communitiesTable.matchingKeyingActive })
    .from(communitiesTable)
    .where(eq(communitiesTable.foreign, 0))
    .limit(1)
  return Boolean(rows[0]?.active)
}

/**
 * Turn the keying of matching entries on or off for the home community.
 *
 * ⛔ Switching it ON is what starts the spending: the run then works through the
 * entries that have no words, up to a hundred per pass and a pass a minute, until the
 * backlog is gone. That is not a preference, it is a decision about a bill.
 *
 * Switching it OFF is read by the next pass. ⚠️ Not by the pass already running - that
 * one reads the column once, before its batch loop, so up to a hundred more entries
 * are still paid for. "Off" means "buys no more after this pass", not "stops now".
 *
 * `VoidResult` rather than `void`, and the reason is the whole point of the function:
 * an UPDATE that matches no row is an expected runtime failure here, not an
 * impossibility - the read beside this one answers `false` for exactly that state. A
 * `Promise<void>` cannot tell the caller it wrote nothing, and the caller would then
 * report a save that did not happen for the one setting that costs money.
 *
 * Column-targeted rather than a `save()` of the community, because the row is read
 * and written all over this codebase and a whole-entity write would carry back
 * whatever the caller happened to be holding.
 */
export async function dbSetMatchingKeyingActive(
  active: boolean,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(communitiesTable)
    .set({ matchingKeyingActive: active ? 1 : 0 })
    .where(eq(communitiesTable.foreign, 0))

  // ⚠️ The cached row above holds this column too, and it is never invalidated on its
  // own. Nothing reads the switch through it today - the schema comment tells the next
  // reader not to - but a warning in prose is weaker than a cache that is simply
  // correct, and the natural thing to reach for is the cached community.
  homeCommunityDrizzleCache = null

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows > 0) {
    return { success: true }
  }
  return { success: false, error: HomeCommunityNotFound }
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
): Promise<DbCommunity[]> {
  return await DbCommunity.find({
    where: [
      { authenticatedAt: Not(IsNull()) }, // or
      { foreign: false },
    ],
    order,
  })
}
