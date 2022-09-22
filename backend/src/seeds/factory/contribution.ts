/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {
  confirmContribution,
  createContribution,
  updateContribution,
  deleteContribution,
} from '@/seeds/graphql/mutations'
import { login, logout } from '@/seeds/graphql/queries'
import { ContributionInterface } from '@/seeds/contribution/ContributionInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { User } from '@entity/User'
import { Transaction } from '@entity/Transaction'
import { Contribution } from '@entity/Contribution'
import { UserInterface } from '../users/UserInterface'
// import CONFIG from '@/config/index'

export const nMonthsBefore = (date: Date, months = 1): string => {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

export const contributionFactory = async (
  client: ApolloServerTestClient,
  loginUser: UserInterface,
  contribution: ContributionInterface,
): Promise<Contribution | void> => {
  const { mutate, query } = client

  await query({ query: login, variables: { email: loginUser.email, password: loginUser.password } })

  // TODO it would be nice to have this mutation return the id
  await mutate({
    mutation: createContribution,
    variables: {
      amount: contribution.capturedAmount,
      memo: contribution.capturedMemo,
      creationDate: contribution.creationDate,
    },
  })

  const user = await User.findOneOrFail({ where: { email: loginUser.email } })

  const pendingCreation = await Contribution.findOneOrFail({
    where: { userId: user.id, amount: contribution.capturedAmount },
    order: { createdAt: 'DESC' },
  })

  if (contribution.updated) {
    await mutate({
      mutation: updateContribution,
      variables: {
        id: pendingCreation.id,
        amount: contribution.updatedAmount,
        memo: contribution.updatedMemo,
        creationDate: contribution.creationDate,
      },
    })
  }

  if (contribution.deleted) {
    await mutate({
      mutation: deleteContribution,
      variables: {
        id: pendingCreation.id,
        amount: contribution.updatedAmount,
        memo: contribution.updatedMemo,
        creationDate: contribution.creationDate,
      },
    })
  }
  if (contribution.confirmed) {
    await query({ query: logout })
    await query({ query: login, variables: { email: 'peter@lustig.de', password: 'Aa12345_' } })

    await mutate({ mutation: confirmContribution, variables: { id: pendingCreation.id } })

    const confirmedCreation = await Contribution.findOneOrFail({ id: pendingCreation.id })

    if (contribution.moveCreationDate) {
      const transaction = await Transaction.findOneOrFail({
        where: { userId: user.id, creationDate: new Date(contribution.creationDate) },
        order: { balanceDate: 'DESC' },
      })
      if (transaction.decay.equals(0) && transaction.creationDate) {
        confirmedCreation.contributionDate = new Date(
          nMonthsBefore(transaction.creationDate, contribution.moveCreationDate),
        )
        transaction.creationDate = new Date(
          nMonthsBefore(transaction.creationDate, contribution.moveCreationDate),
        )
        transaction.balanceDate = new Date(
          nMonthsBefore(transaction.balanceDate, contribution.moveCreationDate),
        )
        await transaction.save()
        await confirmedCreation.save()
      }
    }
  } else {
    return pendingCreation
  }
}
