/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { User } from '@entity/User'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { UserInterface } from '@/seeds/users/UserInterface'

export const userFactory = async (
  client: ApolloServerTestClient,
  user: UserInterface,
): Promise<User> => {
  const { mutate } = client

  const {
    data: {
      createUser: { id },
    },
  } = await mutate({ mutation: createUser, variables: user })
  // console.log('creatUser:', { id }, { user })
  // get user from database
  let dbUser = await User.findOneOrFail({ where: { id }, relations: ['emailContact'] })
  // console.log('dbUser:', dbUser)

  const emailContact = dbUser.emailContact
  // console.log('emailContact:', emailContact)

  if (user.emailChecked) {
    await mutate({
      mutation: setPassword,
      variables: { password: 'Aa12345_', code: emailContact.emailVerificationCode },
    })
  }

  // get last changes of user from database
  dbUser = await User.findOneOrFail({ where: { id } })

  if (user.createdAt || user.deletedAt || user.isAdmin) {
    if (user.createdAt) dbUser.createdAt = user.createdAt
    if (user.deletedAt) dbUser.deletedAt = user.deletedAt
    if (user.isAdmin) dbUser.isAdmin = new Date()
    await dbUser.save()
  }

  // get last changes of user from database
  // dbUser = await User.findOneOrFail({ id }, { withDeleted: true })

  return dbUser
}
