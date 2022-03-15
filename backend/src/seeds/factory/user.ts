/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { User } from '@entity/User'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'

export const createConfirmedUser = async (mutate: any, user: any) => {
  // resetToken()
  await mutate({ mutation: createUser, variables: user })
  const dbUser = await User.findOne({ where: { email: user.email } })
  if (!dbUser) throw new Error('Ups, no user found')
  const optin = await LoginEmailOptIn.findOne({ where: { userId: dbUser.id } })
  if (!optin) throw new Error('Ups, no optin found')
  await mutate({
    mutation: setPassword,
    variables: { password: 'Aa12345_', code: optin.verificationCode },
  })
}
