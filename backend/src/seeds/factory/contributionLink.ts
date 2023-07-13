/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { ApolloServerTestClient } from 'apollo-server-testing'

import { ContributionLink } from '@model/ContributionLink'

import { ContributionLinkInterface } from '@/seeds/contributionLink/ContributionLinkInterface'
import { login, createContributionLink } from '@/seeds/graphql/mutations'

export const contributionLinkFactory = async (
  client: ApolloServerTestClient,
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLink> => {
  const { mutate } = client

  // login as admin
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = await mutate({
    mutation: login,
    variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
  })
  console.log('user=', user)
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
  console.log('link...', result)
  return result.data.createContributionLink
}
