import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { User } from '@entity/User'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { UserInterface } from '@/seeds/users/UserInterface'
import { ApolloServerTestClient } from 'apollo-server-testing'

export const userFactory = async (
  client: any,
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

    if (user.createdAt) dbUser.createdAt = user.createdAt
    if (user.deletedAt) dbUser.deletedAt = user.deletedAt
    if (user.isAdmin) dbUser.isAdmin = new Date()
    await dbUser.save()
  }
}
