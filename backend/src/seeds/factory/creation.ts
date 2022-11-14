/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { backendLogger as logger } from '@/server/logger'
import { login, adminCreateContribution, confirmContribution } from '@/seeds/graphql/mutations'
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
  logger.trace('creationFactory...')
  await mutate({ mutation: login, variables: { email: 'peter@lustig.de', password: 'Aa12345_' } })
  logger.trace('creationFactory... after login')
  // TODO it would be nice to have this mutation return the id
  await mutate({ mutation: adminCreateContribution, variables: { ...creation } })
  logger.trace('creationFactory... after adminCreateContribution')

  const user = await findUserByEmail(creation.email) // userContact.user

  const pendingCreation = await Contribution.findOneOrFail({
    where: { userId: user.id, amount: creation.amount },
    order: { createdAt: 'DESC' },
  })
  logger.trace(
    'creationFactory... after Contribution.findOneOrFail pendingCreation=',
    pendingCreation,
  )
  if (creation.confirmed) {
    logger.trace('creationFactory... creation.confirmed=', creation.confirmed)
    await mutate({ mutation: confirmContribution, variables: { id: pendingCreation.id } })
    logger.trace('creationFactory... after confirmContribution')
    const confirmedCreation = await Contribution.findOneOrFail({ id: pendingCreation.id })
    logger.trace(
      'creationFactory... after Contribution.findOneOrFail confirmedCreation=',
      confirmedCreation,
    )

    if (creation.moveCreationDate) {
      logger.trace('creationFactory... creation.moveCreationDate=', creation.moveCreationDate)
      const transaction = await Transaction.findOneOrFail({
        where: { userId: user.id, creationDate: new Date(creation.creationDate) },
        order: { balanceDate: 'DESC' },
      })
      logger.trace('creationFactory... after Transaction.findOneOrFail transaction=', transaction)

      if (transaction.decay.equals(0) && transaction.creationDate) {
        confirmedCreation.contributionDate = new Date(
          nMonthsBefore(transaction.creationDate, creation.moveCreationDate),
        )
        transaction.creationDate = new Date(
          nMonthsBefore(transaction.creationDate, creation.moveCreationDate),
        )
        transaction.balanceDate = new Date(
          nMonthsBefore(transaction.balanceDate, creation.moveCreationDate),
        )
        logger.trace('creationFactory... before transaction.save transaction=', transaction)
        await transaction.save()
        logger.trace(
          'creationFactory... before confirmedCreation.save confirmedCreation=',
          confirmedCreation,
        )
        await confirmedCreation.save()
      }
    }
  } else {
    logger.trace('creationFactory... pendingCreation=', pendingCreation)
    return pendingCreation
  }
}
