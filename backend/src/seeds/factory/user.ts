import { User } from '@entity/User'
import type { ApolloServerTestClient } from 'apollo-server-testing'

import { RoleNames } from '@enum/RoleNames'

import { setUserRole } from '@/graphql/resolver/util/modifyUserRole'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { createUser, setPassword } from '@/seeds/graphql/mutations'
import type { UserInterface } from '@/seeds/users/UserInterface'

export const userFactory = async (
  client: ApolloServerTestClient,
  user: UserInterface,
): Promise<User> => {
  const { mutate } = client

  const homeCom = await writeHomeCommunityEntry()

  const response = await mutate({ mutation: createUser, variables: user })
  if (!response?.data?.createUser) {
    // biome-ignore lint/suspicious/noConsole: will be used in tests where logging is mocked
    console.log(response)
    throw new Error('createUser mutation returned unexpected response')
  }
  const {
    data: {
      createUser: { id },
    },
  } = response
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
    if (user.createdAt) {
      dbUser.createdAt = user.createdAt
    }
    if (user.deletedAt) {
      dbUser.deletedAt = user.deletedAt
    }
    const userRole = user.role as RoleNames
    if (userRole && (userRole === RoleNames.ADMIN || userRole === RoleNames.MODERATOR)) {
      await setUserRole(dbUser, user.role)
    }
    await dbUser.save()
  }
  try {
    if (homeCom.communityUuid) {
      dbUser.communityUuid = homeCom.communityUuid
      await User.save(dbUser)
    }
  } catch (_err) {
    // no homeCommunity exists
  }

  // get last changes of user from database
  dbUser = await User.findOneOrFail({
    where: { id },
    withDeleted: true,
    relations: ['emailContact', 'userRoles'],
  })
  return dbUser
}
