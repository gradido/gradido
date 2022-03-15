/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../src/server/createServer'
import { initialize } from '@dbTools/helpers'
import { createUser, setPassword } from '@/seeds/graphql/mutations'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { User } from '@entity/User'
import { entities } from '@entity/index'

export const headerPushMock = jest.fn((t) => {
  context.token = t.value
})

const context = {
  token: '',
  setHeaders: {
    push: headerPushMock,
    forEach: jest.fn(),
  },
}

export const cleanDB = async () => {
  // this only works as lond we do not have foreign key constraints
  for (let i = 0; i < entities.length; i++) {
    await resetEntity(entities[i])
  }
}

export const testEnvironment = async () => {
  const server = await createServer(context)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  await initialize()
  return { mutate, query, con }
}

export const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((i: any) => i.id)
    await entity.delete(ids)
  }
}

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

export const resetToken = () => {
  context.token = ''
}
