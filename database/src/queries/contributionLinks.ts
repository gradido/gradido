import { and, eq, isNull } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { contributionLinksTable } from '../schemas'

// A deleted link redeems nothing - TypeORM left it out on its own (`@DeleteDateColumn`).
export async function dbFindContributionLinkIdByCode(redeemCode: string): Promise<number | null> {
  const rows = await drizzleDb()
    .select({ id: contributionLinksTable.id })
    .from(contributionLinksTable)
    .where(
      and(
        eq(contributionLinksTable.code, redeemCode.replace('CL-', '')),
        isNull(contributionLinksTable.deletedAt),
      ),
    )
  return rows[0] ? rows[0].id : null
}
