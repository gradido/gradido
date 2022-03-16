/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { User } from '@entity/User'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { ServerUser } from '@entity/ServerUser'
import { UserInterface } from '@/seeds/users/UserInterface'

export const createUserFactory = async (mutate: any, user: UserInterface): Promise<void> => {
  await mutate({ mutation: createUser, variables: user })
  let dbUser = await User.findOneOrFail({ where: { email: user.email } })

  if (user.emailChecked) {
    const optin = await LoginEmailOptIn.findOneOrFail({ where: { userId: dbUser.id } })
    await mutate({
      mutation: setPassword,
      variables: { password: 'Aa12345_', code: optin.verificationCode },
    })
  }

  // refetch data
  dbUser = await User.findOneOrFail({ where: { email: user.email } })

  if (user.createdAt || user.deletedAt) {
    if (user.createdAt) dbUser.createdAt = user.createdAt
    if (user.deletedAt) dbUser.deletedAt = user.deletedAt
    await dbUser.save()
  }

  if (user.isAdmin) {
    const admin = new ServerUser()
    admin.username = dbUser.firstName
    admin.password = 'please_refactor'
    admin.email = dbUser.email
    admin.role = 'admin'
    admin.activated = 1
    admin.lastLogin = new Date()
    admin.created = dbUser.createdAt
    admin.modified = dbUser.createdAt
    await admin.save()
  }
}
