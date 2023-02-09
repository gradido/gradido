/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { createTestClient } from 'apollo-server-testing'
import createServer from '@/server/createServer'

let query: any

// to do: We need a setup for the tests that closes the connection
let con: any

beforeAll(async () => {
  const server = await createServer()
  con = server.con
  query = createTestClient(server.apollo).query
})

afterAll(async () => {
  await con.close()
})

describe('TestResolver', () => {
  const getTestQuery = `
    query {
      test {
        api
      }
    }
  `

  describe('getTestApi', () => {
    it('returns 1_1', async () => {
      await expect(query({ query: getTestQuery })).resolves.toMatchObject({
        data: {
          test: {
            api: '1_0',
          },
        },
      })
    })
  })
})
