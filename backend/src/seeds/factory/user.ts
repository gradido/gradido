import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { User } from '@entity/User'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { ServerUser } from '@entity/ServerUser'
import { UserInterface } from '@/seeds/users/UserInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'

export const userFactory = async (
  client: ApolloServerTestClient,
  user: UserInterface,
): Promise<void> => {
  const { mutate } = client

  const {
    data: {
      createUser: { id },
    },
  } = await mutate({ mutation: createUser, variables: user })

  if (user.emailChecked) {
    const optin = await LoginEmailOptIn.findOneOrFail({ userId: id })
    await mutate({
      mutation: setPassword,
      variables: { password: 'Aa12345_', code: optin.verificationCode },
    })
  }

  if (user.createdAt || user.deletedAt || user.isAdmin) {
    // get user from database
    const dbUser = await User.findOneOrFail({ id })

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
}
