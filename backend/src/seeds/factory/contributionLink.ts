import { 
  contributionLinkFactory as contributionLinkFactoryDb, 
  ContributionLinkInterface 
} from 'database'

import { ContributionLink } from '@model/ContributionLink'

export { ContributionLinkInterface }

export async function contributionLinkFactory (
  _client: any,
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLink> {
  return new ContributionLink(await contributionLinkFactoryDb(contributionLink))
}
