import { and, asc, eq, gt, inArray, isNull, lt, or } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { FederatedCommunity, federatedCommunitySchema, federationApiVersions, Result } from 'shared'
import * as v from 'valibot'
import { DrizzleTransaction, drizzleDb, federatedCommunitiesTable } from '..'
import { FederatedCommunity as DbFederatedCommunity } from '../entity'
import { DBNotFoundError } from '../errorTypes'

const FederatedCommunityNotFound = (where: string) =>
  new DBNotFoundError('federated_communities', where)

/**
 * The entry through which another community is reached on one API version.
 *
 * The same lookup core's processXComSendCoins makes inline with `findOneOrFail`; that caller
 * stays as it is, this one serves the member pictures relay. Not found is an expected
 * outcome -- the other community announced no entry for this version, or the DHT has not
 * written it yet -- so it is returned, not thrown.
 */
export async function dbFindFederatedCommunityByPublicKeyAndApi(
  publicKey: Buffer,
  apiVersion: string,
): Promise<Result<DbFederatedCommunity, DBNotFoundError>> {
  const federatedCommunity = await DbFederatedCommunity.findOne({
    where: { publicKey, apiVersion },
  })
  if (!federatedCommunity) {
    return {
      success: false,
      error: FederatedCommunityNotFound(
        `public_key = ${publicKey.toString('hex')} and api_version = ${apiVersion}`,
      ),
    }
  }
  return { success: true, value: federatedCommunity }
}

export async function dbFindFederatedCommunitiesNotVerified(
  limit: number,
  lastFederatedCommunityId: number,
): Promise<FederatedCommunity[]> {
  const rows = await drizzleDb()
    .select()
    .from(federatedCommunitiesTable)
    .where(
      and(
        eq(federatedCommunitiesTable.foreign, true),
        inArray(federatedCommunitiesTable.apiVersion, federationApiVersions),
        or(
          isNull(federatedCommunitiesTable.verifiedAt),
          lt(federatedCommunitiesTable.verifiedAt, federatedCommunitiesTable.lastAnnouncedAt),
        ),
        gt(federatedCommunitiesTable.id, lastFederatedCommunityId),
      ),
    )
    .orderBy(asc(federatedCommunitiesTable.id))
    .limit(limit)
  return rows.map((federatedCommunity) => v.parse(federatedCommunitySchema, federatedCommunity))
}

export async function dbClearFederatedCommunities(): Promise<void> {
  await drizzleDb()
    .delete(federatedCommunitiesTable)
    .where(eq(federatedCommunitiesTable.foreign, true))
}

export async function dbUpdateFederatedCommunitiesVerified(
  ids: number[],
  now: Date,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx
    .update(federatedCommunitiesTable)
    .set({ verifiedAt: now, updatedAt: now })
    .where(inArray(federatedCommunitiesTable.id, ids))

  return rows[0].affectedRows
}
