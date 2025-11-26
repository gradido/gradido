import { ContributionLink } from '@model/ContributionLink'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { ContributionLinkInterface } from '@/seeds/contributionLink/ContributionLinkInterface'
import { createContributionLink, login } from '@/seeds/graphql/mutations'

export const contributionLinkFactory = async (
  client: ApolloServerTestClient,
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLink> => {
  const { mutate } = client

  // login as admin
  await mutate({
    mutation: login,
    variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
  })
  const variables = {
    amount: contributionLink.amount,
    memo: contributionLink.memo,
    name: contributionLink.name,
    cycle: 'ONCE',
    maxPerCycle: 1,
    maxAmountPerMonth: 200,
    validFrom: contributionLink.validFrom ? contributionLink.validFrom.toISOString() : undefined,
    validTo: contributionLink.validTo ? contributionLink.validTo.toISOString() : undefined,
  }

  const result = await mutate({ mutation: createContributionLink, variables })
  return result.data.createContributionLink
}
