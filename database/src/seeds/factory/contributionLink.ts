import { GradidoUnit } from 'shared'
import { ContributionLink } from '../../entity'
import { ContributionCycleType } from '../../enum'
import { ContributionLinksInsert } from '../../schemas/drizzle.schema'
import { ContributionLinkInterface } from '../contributionLink/ContributionLinkInterface'
import { transactionLinkCode } from './transactionLink'

export function contributionLinkFactory(
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLink> {
  return createContributionLink(contributionLink)
}

export function createContributionLink(
  contributionLinkData: ContributionLinkInterface,
): Promise<ContributionLink> {
  const contributionLink = new ContributionLink()
  contributionLink.amount = GradidoUnit.fromNumber(contributionLinkData.amount)
  contributionLink.name = contributionLinkData.name
  contributionLink.memo = contributionLinkData.memo
  contributionLink.createdAt = new Date()
  contributionLink.code = transactionLinkCode(new Date())
  contributionLink.cycle = ContributionCycleType.ONCE
  if (contributionLinkData.validFrom) {
    contributionLink.validFrom = contributionLinkData.validFrom
  }
  if (contributionLinkData.validTo) {
    contributionLink.validTo = contributionLinkData.validTo
  }
  contributionLink.maxAmountPerMonth = GradidoUnit.fromNumber(200)
  contributionLink.maxPerCycle = 1

  return contributionLink.save()
}

/**
 * The row createContributionLink writes, for the seed. The entity calls the amount columns
 * `amount` and `maxAmountPerMonth`, the drizzle schema by their column names.
 */
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
