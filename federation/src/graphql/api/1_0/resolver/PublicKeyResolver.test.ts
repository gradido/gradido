/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { createTestClient } from 'apollo-server-testing'
import createServer from '@/server/createServer'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import CONFIG from '@/config'

let query: any

// to do: We need a setup for the tests that closes the connection
let con: any

CONFIG.FEDERATION_API = '1_0'

beforeAll(async () => {
  const server = await createServer()
  con = server.con
  query = createTestClient(server.apollo).query
  DbFederatedCommunity.clear()
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
      const homeCom = new DbFederatedCommunity()
      homeCom.foreign = false
      homeCom.apiVersion = '1_0'
      homeCom.endPoint = 'endpoint-url'
      homeCom.publicKey = Buffer.from('homeCommunity-publicKey')
      await DbFederatedCommunity.insert(homeCom)
    })

    it('returns homeCommunity-publicKey', async () => {
      await expect(query({ query: getPublicKeyQuery })).resolves.toMatchObject({
        data: {
          getPublicKey: {
            publicKey: expect.stringMatching('homeCommunity-publicKey'),
          },
        },
      })
    })
  })
})
