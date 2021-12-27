/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../../server/createServer'
import { resetDB, initialize } from '@dbTools/helpers'

let mutate: any
let con: any

beforeAll(async () => {
  const server = await createServer({})
  con = server.con
  mutate = createTestClient(server.apollo).mutate
  await initialize()
  await resetDB()
})

describe('UserResolver', () => {
  describe('createUser', () => {
    it('works', () => {
      expect(true).toBeTruthy()
    })
  })
})

afterAll(async () => {
  await resetDB(true)
  await con.close()
})
