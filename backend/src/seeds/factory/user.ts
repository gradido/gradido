/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { User } from '@entity/User'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { ROLE_NAMES } from '@/auth/ROLES'
import { setUserRole } from '@/graphql/resolver/util/modifyUserRole'
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
  // get user from database
  let dbUser = await User.findOneOrFail({ where: { id }, relations: ['emailContact', 'userRoles'] })

  const emailContact = dbUser.emailContact

  if (user.emailChecked) {
    await mutate({
      mutation: setPassword,
      variables: { password: 'Aa12345_', code: emailContact.emailVerificationCode },
    })
  }

  // get last changes of user from database
  dbUser = await User.findOneOrFail({ where: { id }, relations: ['userRoles'] })

  if (user.createdAt || user.deletedAt || user.role) {
    if (user.createdAt) dbUser.createdAt = user.createdAt
    if (user.deletedAt) dbUser.deletedAt = user.deletedAt
    if (
      user.role &&
      (user.role === ROLE_NAMES.ROLE_NAME_ADMIN || user.role === ROLE_NAMES.ROLE_NAME_MODERATOR)
    ) {
      await setUserRole(dbUser, user.role)
    }
    await dbUser.save()
  }

  // get last changes of user from database
  dbUser = await User.findOneOrFail({
    where: { id },
    withDeleted: true,
    relations: ['emailContact', 'userRoles'],
  })
  return dbUser
}
