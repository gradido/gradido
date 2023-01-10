/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { login, createContribution, confirmContribution } from '@/seeds/graphql/mutations'
import { CreationInterface } from '@/seeds/creation/CreationInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { Transaction } from '@entity/Transaction'
import { Contribution } from '@entity/Contribution'
import { findUserByEmail } from '@/graphql/resolver/UserResolver'
// import CONFIG from '@/config/index'

export const nMonthsBefore = (date: Date, months = 1): string => {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

export const creationFactory = async (
  client: ApolloServerTestClient,
  creation: CreationInterface,
): Promise<Contribution | void> => {
  const { mutate } = client
  await mutate({ mutation: login, variables: { email: creation.email, password: 'Aa12345_' } })

  const {
    data: { createContribution: contribution },
  } = await mutate({ mutation: createContribution, variables: { ...creation } })

  if (creation.confirmed) {
    const user = await findUserByEmail(creation.email) // userContact.user

    await mutate({ mutation: login, variables: { email: 'peter@lustig.de', password: 'Aa12345_' } })
    await mutate({ mutation: confirmContribution, variables: { id: contribution.id } })
    const confirmedContribution = await Contribution.findOneOrFail({ id: contribution.id })

    if (creation.moveCreationDate) {
      const transaction = await Transaction.findOneOrFail({
        where: { userId: user.id, creationDate: new Date(creation.creationDate) },
        order: { balanceDate: 'DESC' },
      })

      if (transaction.decay.equals(0) && transaction.creationDate) {
        confirmedContribution.contributionDate = new Date(
          nMonthsBefore(transaction.creationDate, creation.moveCreationDate),
        )
        transaction.creationDate = new Date(
          nMonthsBefore(transaction.creationDate, creation.moveCreationDate),
        )
        transaction.balanceDate = new Date(
          nMonthsBefore(transaction.balanceDate, creation.moveCreationDate),
        )
        await transaction.save()
        await confirmedContribution.save()
      }
    }
  } else {
    return contribution
  }
}
