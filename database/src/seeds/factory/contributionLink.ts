import { GradidoUnit } from 'shared'
import { ContributionLink } from '../../entity'
import { ContributionCycleType } from '../../enum'
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
