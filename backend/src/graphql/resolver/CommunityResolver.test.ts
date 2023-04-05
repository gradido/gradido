/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Connection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { testEnvironment } from '@test/helpers'

import { getCommunities } from '@/seeds/graphql/queries'

// to do: We need a setup for the tests that closes the connection
let query: ApolloServerTestClient['query'], con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  query = testEnv.query
  con = testEnv.con
  await DbCommunity.clear()
})

afterAll(async () => {
  await con.close()
})

describe('CommunityResolver', () => {
  describe('getCommunities', () => {
    let homeCom1: DbCommunity
    let homeCom2: DbCommunity
    let homeCom3: DbCommunity
    let foreignCom1: DbCommunity
    let foreignCom2: DbCommunity
    let foreignCom3: DbCommunity
    describe('with empty list', () => {
      it('returns no community entry', async () => {
        // const result: Community[] = await query({ query: getCommunities })
        // expect(result.length).toEqual(0)
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [],
          },
        })
      })
    })

    describe('only home-communities entries', () => {
      beforeEach(async () => {
        jest.clearAllMocks()

        homeCom1 = DbCommunity.create()
        homeCom1.foreign = false
        homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom1.apiVersion = '1_0'
        homeCom1.endPoint = 'http://localhost'
        homeCom1.createdAt = new Date()
        await DbCommunity.insert(homeCom1)

        homeCom2 = DbCommunity.create()
        homeCom2.foreign = false
        homeCom2.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom2.apiVersion = '1_1'
        homeCom2.endPoint = 'http://localhost'
        homeCom2.createdAt = new Date()
        await DbCommunity.insert(homeCom2)

        homeCom3 = DbCommunity.create()
        homeCom3.foreign = false
        homeCom3.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom3.apiVersion = '2_0'
        homeCom3.endPoint = 'http://localhost'
        homeCom3.createdAt = new Date()
        await DbCommunity.insert(homeCom3)
      })

      it('returns three home-community entries', async () => {
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [
              {
                id: 1,
                foreign: homeCom1.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom1.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 2,
                foreign: homeCom2.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 3,
                foreign: homeCom3.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/2_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom3.createdAt.toISOString(),
                updatedAt: null,
              },
            ],
          },
        })
      })
    })

    describe('plus foreign-communities entries', () => {
      beforeEach(async () => {
        jest.clearAllMocks()

        foreignCom1 = DbCommunity.create()
        foreignCom1.foreign = true
        foreignCom1.publicKey = Buffer.from('publicKey-ForeignCommunity')
        foreignCom1.apiVersion = '1_0'
        foreignCom1.endPoint = 'http://remotehost'
        foreignCom1.createdAt = new Date()
        await DbCommunity.insert(foreignCom1)

        foreignCom2 = DbCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.publicKey = Buffer.from('publicKey-ForeignCommunity')
        foreignCom2.apiVersion = '1_1'
        foreignCom2.endPoint = 'http://remotehost'
        foreignCom2.createdAt = new Date()
        await DbCommunity.insert(foreignCom2)

        foreignCom3 = DbCommunity.create()
        foreignCom3.foreign = true
        foreignCom3.publicKey = Buffer.from('publicKey-ForeignCommunity')
        foreignCom3.apiVersion = '1_2'
        foreignCom3.endPoint = 'http://remotehost'
        foreignCom3.createdAt = new Date()
        await DbCommunity.insert(foreignCom3)
      })

      it('returns 3x home and 3x foreign-community entries', async () => {
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [
              {
                id: 1,
                foreign: homeCom1.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom1.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 2,
                foreign: homeCom2.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 3,
                foreign: homeCom3.foreign,
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
                url: expect.stringMatching('http://localhost/api/2_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom3.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 4,
                foreign: foreignCom1.foreign,
                publicKey: expect.stringMatching('publicKey-ForeignCommunity'),
                url: expect.stringMatching('http://remotehost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: foreignCom1.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 5,
                foreign: foreignCom2.foreign,
                publicKey: expect.stringMatching('publicKey-ForeignCommunity'),
                url: expect.stringMatching('http://remotehost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: foreignCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 6,
                foreign: foreignCom3.foreign,
                publicKey: expect.stringMatching('publicKey-ForeignCommunity'),
                url: expect.stringMatching('http://remotehost/api/1_2'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: foreignCom3.createdAt.toISOString(),
                updatedAt: null,
              },
            ],
          },
        })
      })
    })
  })
})
