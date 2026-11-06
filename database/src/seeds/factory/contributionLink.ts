import { GradidoUnit } from 'shared'
import { ContributionCycleType } from '../../enum'
import { dbInsertContributionLink } from '../../queries/contributionLinks'
import { ContributionLinksInsert } from '../../schemas/drizzle.schema'
import { ContributionLinkInterface } from '../contributionLink/ContributionLinkInterface'
import { transactionLinkCode } from './transactionLink'

export async function contributionLinkFactory(
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLinksInsert & { id: number }> {
  const row = buildContributionLinkRow(contributionLink)
  return { ...row, id: await dbInsertContributionLink(row) }
}

// The row of one contribution link, for contributionLinkFactory and the seed alike.
export function buildContributionLinkRow(
  contributionLinkData: ContributionLinkInterface,
): ContributionLinksInsert {
  if (!contributionLinkData.validFrom) {
    // the column is NOT NULL without a default
    throw new Error(`contribution link ${contributionLinkData.name} has no validFrom`)
  }
  const now = new Date()
  const row: ContributionLinksInsert = {
    amountGdd4: GradidoUnit.fromNumber(contributionLinkData.amount),
    name: contributionLinkData.name,
    memo: contributionLinkData.memo,
    createdAt: now,
    code: transactionLinkCode(now),
    cycle: ContributionCycleType.ONCE,
    validFrom: contributionLinkData.validFrom,
    maxAmountPerMonthGdd4: GradidoUnit.fromNumber(200),
    maxPerCycle: 1,
  }
  if (contributionLinkData.validTo) {
    row.validTo = contributionLinkData.validTo
  }
  return row
}
