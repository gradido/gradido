/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { User } from '@entity/User'
import { UserRole } from '@entity/UserRole'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { ROLE_NAMES } from '@/auth/ROLES'
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
  let dbUser = await User.findOneOrFail({ where: { id }, relations: ['emailContact', 'userRoles'] })
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
  dbUser = await User.findOneOrFail({ where: { id }, relations: ['userRoles'] })

  if (user.createdAt || user.deletedAt || user.role) {
    if (user.createdAt) dbUser.createdAt = user.createdAt
    if (user.deletedAt) dbUser.deletedAt = user.deletedAt
    if (
      user.role &&
      (user.role === ROLE_NAMES.ROLE_NAME_ADMIN || user.role === ROLE_NAMES.ROLE_NAME_MODERATOR)
    ) {
      dbUser.userRoles = [] as UserRole[]
      dbUser.userRoles[0] = UserRole.create()
      dbUser.userRoles[0].createdAt = new Date()
      dbUser.userRoles[0].role = user.role
      dbUser.userRoles[0].userId = dbUser.id
      await dbUser.userRoles[0].save()
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
