/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { createTestClient } from 'apollo-server-testing'
import createServer from '@/server/createServer'
import { Community as DbCommunity } from '@entity/Community'

let query: any
let testEnv: any

// to do: We need a setup for the tests that closes the connection
let con: any

beforeAll(async () => {
  const server = await createServer()
  con = server.con
  query = createTestClient(server.apollo).query
  DbCommunity.clear()
})

afterAll(async () => {
  await con.close()
})

describe('PublicKeyResolver', () => {
  const getPublicKeyQuery = `
    query {
      getPublicKey
       {
        publicKey
      }
    }
  `

  describe('getPublicKey', () => {
    beforeEach(async () => {
      const homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.apiVersion = '1_0'
      homeCom.endPoint = 'endpoint-url'
      homeCom.publicKey = Buffer.from('homeCommunity-publicKey')
      await DbCommunity.insert(homeCom)
    })

    it('returns homeCommunity-publicKey', async () => {
      await expect(query({ query: getPublicKeyQuery })).resolves.toContainEqual(
        expect.objectContaining({
          data: {
            getPublicKey: {
              publicKey: 'homeCommunity-publicKey',
            },
          },
        })
      )
    })
  })
})
