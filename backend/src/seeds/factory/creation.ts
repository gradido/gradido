/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { adminCreateContribution, confirmContribution } from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { CreationInterface } from '@/seeds/creation/CreationInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { User } from '@entity/User'
import { Transaction } from '@entity/Transaction'
import { Contribution } from '@entity/Contribution'
// import CONFIG from '@/config/index'

export const nMonthsBefore = (date: Date, months = 1): string => {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

export const creationFactory = async (
  client: ApolloServerTestClient,
  creation: CreationInterface,
): Promise<Contribution | void> => {
  const { mutate, query } = client

  await query({ query: login, variables: { email: 'peter@lustig.de', password: 'Aa12345_' } })

  // TODO it would be nice to have this mutation return the id
  await mutate({ mutation: adminCreateContribution, variables: { ...creation } })

  const user = await User.findOneOrFail({ where: { email: creation.email } })

  const pendingCreation = await Contribution.findOneOrFail({
    where: { userId: user.id, amount: creation.amount },
    order: { createdAt: 'DESC' },
  })

  if (creation.confirmed) {
    await mutate({ mutation: confirmContribution, variables: { id: pendingCreation.id } })

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
}
