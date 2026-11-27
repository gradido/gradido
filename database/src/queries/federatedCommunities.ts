import { and, asc, eq, gt, inArray, isNull, lt, or } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { FederatedCommunity, federatedCommunitySchema, federationApiVersions } from 'shared'
import * as v from 'valibot'
import { DrizzleTransaction, drizzleDb, federatedCommunitiesTable } from '..'

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
