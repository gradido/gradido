import { ApolloServerTestClient } from 'apollo-server-testing'
import { User } from 'database'

import { RoleNames } from '@enum/RoleNames'

import { setUserRole } from '@/graphql/resolver/util/modifyUserRole'
import { writeHomeCommunityEntry } from '@/seeds/community'
import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { UserInterface } from '@/seeds/users/UserInterface'

export const userFactory = async (
  client: ApolloServerTestClient,
  user: UserInterface,
): Promise<User> => {
  const { mutate } = client

  const homeCom = await writeHomeCommunityEntry()
  // console.log('call createUser with', JSON.stringify(user, null, 2))
  const response = await mutate({ mutation: createUser, variables: user })
  if (!response?.data?.createUser) {
    // console.log(JSON.stringify(response, null, 2))
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
  dbUser = await User.findOneOrFail({ where: { id }, relations: { userRoles: true, emailContact: true } })

  if (user.createdAt || user.deletedAt || user.role) {
    if (user.createdAt) {
      dbUser.createdAt = user.createdAt
      // make sure emailContact is also updated for e2e test, prevent failing when time between seeding and test run is < 1 minute
      dbUser.emailContact.createdAt = user.createdAt
      dbUser.emailContact.updatedAt = user.createdAt
      await dbUser.emailContact.save()
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
