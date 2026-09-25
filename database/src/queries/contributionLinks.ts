import { eq } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { contributionLinksTable } from '../schemas'

export async function dbFindContributionLinkIdByCode(redeemCode: string): Promise<number | null> {
  const rows = await drizzleDb()
    .select({ id: contributionLinksTable.id })
    .from(contributionLinksTable)
    .where(eq(contributionLinksTable.code, redeemCode.replace('CL-', '')))
  return rows[0] ? rows[0].id : null
}
