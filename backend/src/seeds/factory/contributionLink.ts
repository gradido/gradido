import { ContributionLink } from '@model/ContributionLink'
import {
  ContributionLinkInterface,
  contributionLinkFactory as contributionLinkFactoryDb,
} from 'database'

export { ContributionLinkInterface }

export async function contributionLinkFactory(
  _client: any,
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLink> {
  return new ContributionLink(await contributionLinkFactoryDb(contributionLink))
}
