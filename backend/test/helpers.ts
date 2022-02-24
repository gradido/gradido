/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../src/server/createServer'
import { resetDB, initialize } from '@dbTools/helpers'
import { createUserMutation, setPasswordMutation } from './graphql'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { User } from '@entity/User'

export const testEnvironment = async (context: any) => {
  const server = await createServer(context)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  await initialize()
  await resetDB()
  return { mutate, query, con }
}

export const resetEntity = async (entity: any) => {
  const items = await entity.find()
  if (items.length > 0) {
    const ids = items.map((i: any) => i.id)
    await entity.delete(ids)
  }
}

export const resetEntities = async (entities: any[]) => {
  for (let i = 0; i < entities.length; i++) {
    await resetEntity(entities[i])
  }
}

export const createUser = async (mutate: any, user: any) => {
  await mutate({ mutation: createUserMutation, variables: user })
  const dbUser = await User.findOne({ where: { email: user.email } })
  if (!dbUser) throw new Error('Ups, no user found')
  const optin = await LoginEmailOptIn.findOne(dbUser.id)
  if (!optin) throw new Error('Ups, no optin found')
  await mutate({
    mutation: setPasswordMutation,
    variables: { password: 'Aa12345_', code: optin.verificationCode },
  })
}
