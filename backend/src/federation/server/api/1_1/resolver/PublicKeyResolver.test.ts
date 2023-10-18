/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Connection } from '@dbTools/typeorm'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
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

const FEDERATION_API = '1_1'

beforeAll(async () => {
  testEnv = await testEnvironment(await federationSchema(FEDERATION_API))
  query = testEnv.query
  con = testEnv.con
  await DbFederatedCommunity.clear()
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
