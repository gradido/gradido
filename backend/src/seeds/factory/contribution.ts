/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createContributionLink } from '@/seeds/graphql/mutations'
// import { User } from '@entity/User'
import { login } from '@/seeds/graphql/queries'
import { ContributionInterface } from '@/seeds/creation/ContributionInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { ContributionLink } from '@/graphql/model/ContributionLink'
// import { ContributionLinks } from '@entity/ContributionLinks'

// import CONFIG from '@/config/index'

export const nMonthsBefore = (date: Date, months = 1): string => {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

export const contributionFactory = async (
  client: ApolloServerTestClient,
  contribution: ContributionInterface,
): Promise<ContributionLink | void> => {
  const { mutate, query } = client

  await query({ query: login, variables: { email: 'peter@lustig.de', password: 'Aa12345_' } })

  // let contributionLink: ContributionLink
  // TODO it would be nice to have this mutation return the id
  const contributionLink = await mutate({
    mutation: createContributionLink,
    variables: { ...contribution },
  })

  // const user = await User.findOneOrFail({ where: { email: creation.email } })

  /*
  if (contribution.linkEnabled) {
    await mutate({ mutation: confirmPendingCreation, variables: { id: pendingCreation.id } })

    if (creation.moveCreationDate) {
      const transaction = await Transaction.findOneOrFail({
        where: { userId: user.id, creationDate: new Date(creation.creationDate) },
        order: { balanceDate: 'DESC' },
      })
      if (transaction.decay.equals(0) && transaction.creationDate) {
        transaction.creationDate = new Date(
          nMonthsBefore(transaction.creationDate, creation.moveCreationDate),
        )
        transaction.balanceDate = new Date(
          nMonthsBefore(transaction.balanceDate, creation.moveCreationDate),
        )
        await transaction.save()
      }
    }
  } else {
    return pendingCreation
  }
  */
  return contributionLink
}
