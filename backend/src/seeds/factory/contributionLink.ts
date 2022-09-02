import { ApolloServerTestClient } from 'apollo-server-testing'
import { createContributionLink } from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { ContributionLink } from '@model/ContributionLink'
import { ContributionLinkInterface } from '@/seeds/contributionLink/ContributionLinkInterface'
import { User } from '@/graphql/model/User'

export const contributionLinkFactory = async (
  client: ApolloServerTestClient,
  contributionLink: ContributionLinkInterface,
): Promise<ContributionLink> => {
  const { mutate, query } = client

  // login as admin
  const user = await query({
    query: login,
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
