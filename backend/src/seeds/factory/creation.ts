/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createPendingCreation, confirmPendingCreation } from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { CreationInterface } from '@/seeds/creation/CreationInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { User } from '@entity/User'
import { AdminPendingCreation } from '@entity/AdminPendingCreation'
// import CONFIG from '@/config/index'

export const creationFactory = async (
  client: ApolloServerTestClient,
  creation: CreationInterface,
): Promise<void> => {
  const { mutate, query } = client

  // login as Peter Lustig (admin)
  await query({ query: login, variables: { email: 'peter@lustig.de', password: 'Aa12345_' } })

  // get Peter Lustig's user id
  const peterLustig = await User.findOneOrFail({ where: { email: 'peter@lustig.de' } })
  const variables = { ...creation, moderator: peterLustig.id }

  await mutate({ mutation: createPendingCreation, variables })

  // get User
  const user = await User.findOneOrFail({ where: { email: creation.email } })

  if (creation.confirmed) {
    const pendingCreation = await AdminPendingCreation.findOneOrFail({
      where: { userId: user.id },
      order: { created: 'DESC' },
    })

    await mutate({ mutation: confirmPendingCreation, variables: { id: pendingCreation.id } })
  }
}
