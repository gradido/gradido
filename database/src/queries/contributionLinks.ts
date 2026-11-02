import { and, eq, isNull } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { ContributionLinksInsert, contributionLinksTable } from '../schemas'

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

// One statement for all the rows it is given
export async function dbInsertContributionLinks(
  contributionLinks: ContributionLinksInsert[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  if (contributionLinks.length === 0) {
    return
  }
  await tx.insert(contributionLinksTable).values(contributionLinks)
}
