/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Connection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { testEnvironment } from '@test/helpers'

import { schema as federationSchema } from '@/federation/server/schema'

// to do: We need a setup for the tests that closes the connection
let query: ApolloServerTestClient['query'], con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

const FEDERATION_API = '1_0'

beforeAll(async () => {
  testEnv = await testEnvironment(await federationSchema(FEDERATION_API))
  query = testEnv.query
  con = testEnv.con
  await DbCommunity.clear()
})

afterAll(async () => {
  await con.close()
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
      homeCom.publicKey = Buffer.from('homeCommunity-publicKey')
      await DbCommunity.insert(homeCom)
    })

    it('returns public CommunityInfo', async () => {
      await expect(query({ query: getPublicCommunityInfoQuery })).resolves.toMatchObject({
        data: {
          getPublicCommunityInfo: {
            name: 'Community-Name',
            description: 'Community-Description',
            creationDate: homeCom.creationDate?.toISOString(),
            publicKey: expect.stringMatching('homeCommunity-publicKey'),
          },
        },
      })
    })
  })
})
