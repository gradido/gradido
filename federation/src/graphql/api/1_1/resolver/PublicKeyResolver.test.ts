import { createTestClient } from 'apollo-server-testing'
import { AppDatabase, FederatedCommunity as DbFederatedCommunity } from 'database'
import { getLogger } from 'log4js'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { createServer } from '@/server/createServer'

let query: any

// to do: We need a setup for the tests that closes the connection

CONFIG.FEDERATION_API = '1_1'

beforeAll(async () => {
  const server = await createServer(getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apollo`))
  query = createTestClient(server.apollo).query
  DbFederatedCommunity.clear()
})

afterAll(async () => {
  await AppDatabase.getInstance().destroy()
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
      homeCom.apiVersion = '1_1'
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
