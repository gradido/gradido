import { CONFIG } from '@/config'
import { createServer } from '@/server/createServer'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { createTestClient } from 'apollo-server-testing'

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
      homeCom.publicKey = Buffer.from(
        '9f6dcd0d985cc7105cd71c3417d9c291b126c8ca90513197de02191f928ef713',
        'hex',
      )
      await DbFederatedCommunity.insert(homeCom)
    })

    it('returns homeCommunity-publicKey', async () => {
      await expect(query({ query: getPublicKeyQuery })).resolves.toMatchObject({
        data: {
          getPublicKey: {
            publicKey: '9f6dcd0d985cc7105cd71c3417d9c291b126c8ca90513197de02191f928ef713',
          },
        },
      })
    })
  })
})
