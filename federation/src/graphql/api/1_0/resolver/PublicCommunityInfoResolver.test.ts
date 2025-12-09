import { createTestClient } from 'apollo-server-testing'
import { AppDatabase, Community as DbCommunity } from 'database'
import { getLogger } from 'log4js'
import { CONFIG } from '@/config'
import { createServer } from '@/server/createServer'

let query: any

CONFIG.FEDERATION_API = '1_0'

beforeAll(async () => {
  const server = await createServer(getLogger('apollo'))
  query = createTestClient(server.apollo).query
  DbCommunity.clear()
})

afterAll(async () => {
  await AppDatabase.getInstance().destroy()
})

describe('PublicCommunityInfoResolver', () => {
  const getPublicCommunityInfoQuery = `
    query {
      getPublicCommunityInfo
       {
        name
        description
        creationDate
        publicKey
      }
    }
  `

  describe('getPublicCommunityInfo', () => {
    let homeCom: DbCommunity
    beforeEach(async () => {
      homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.url = 'homeCommunity-url'
      homeCom.name = 'Community-Name'
      homeCom.description = 'Community-Description'
      homeCom.creationDate = new Date()
      homeCom.publicKey = Buffer.from(
        '316f2951501f27c664e188d5128505917e8673e8bebce141f86e70907e782a08',
        'hex',
      )
      await DbCommunity.insert(homeCom)
    })

    it('returns public CommunityInfo', async () => {
      await expect(query({ query: getPublicCommunityInfoQuery })).resolves.toMatchObject({
        data: {
          getPublicCommunityInfo: {
            name: 'Community-Name',
            description: 'Community-Description',
            creationDate: homeCom.creationDate?.toISOString(),
            publicKey: '316f2951501f27c664e188d5128505917e8673e8bebce141f86e70907e782a08',
          },
        },
      })
    })
  })
})
