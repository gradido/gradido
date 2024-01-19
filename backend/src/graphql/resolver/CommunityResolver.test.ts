/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Connection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { cleanDB, testEnvironment } from '@test/helpers'

import { getCommunities, communities } from '@/seeds/graphql/queries'

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
  await DbFederatedCommunity.clear()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('CommunityResolver', () => {
  describe('getCommunities', () => {
    let homeCom1: DbFederatedCommunity
    let homeCom2: DbFederatedCommunity
    let homeCom3: DbFederatedCommunity
    let foreignCom1: DbFederatedCommunity
    let foreignCom2: DbFederatedCommunity
    let foreignCom3: DbFederatedCommunity

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
        await cleanDB()
        jest.clearAllMocks()

        homeCom1 = DbFederatedCommunity.create()
        homeCom1.foreign = false
        homeCom1.publicKey = Buffer.from(
          '75bb92ee197a5f5b645669b26b933558870d72791860e4854a41d6bb28e7d61c',
          'hex',
        )
        homeCom1.apiVersion = '1_0'
        homeCom1.endPoint = 'http://localhost/api'
        homeCom1.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom1)

        homeCom2 = DbFederatedCommunity.create()
        homeCom2.foreign = false
        homeCom2.publicKey = Buffer.from(
          '5b47388f9e8db5416201e485398ed0d72ab20d9ee951ccc1754245278e3ae6c6',
          'hex',
        )
        homeCom2.apiVersion = '1_1'
        homeCom2.endPoint = 'http://localhost/api'
        homeCom2.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom2)

        homeCom3 = DbFederatedCommunity.create()
        homeCom3.foreign = false
        homeCom3.publicKey = Buffer.from(
          '2ca593275aa4c11f9c3d43cd4d39586c70e2b7f4359739381940b62d1c8e8928',
          'hex',
        )
        homeCom3.apiVersion = '2_0'
        homeCom3.endPoint = 'http://localhost/api'
        homeCom3.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom3)
      })

      it('returns 3 home-community entries', async () => {
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [
              {
                id: 3,
                foreign: homeCom3.foreign,
                publicKey: expect.stringMatching(
                  '2ca593275aa4c11f9c3d43cd4d39586c70e2b7f4359739381940b62d1c8e8928',
                ),
                url: expect.stringMatching('http://localhost/api/2_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom3.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 2,
                foreign: homeCom2.foreign,
                publicKey: expect.stringMatching(
                  '5b47388f9e8db5416201e485398ed0d72ab20d9ee951ccc1754245278e3ae6c6',
                ),
                url: expect.stringMatching('http://localhost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 1,
                foreign: homeCom1.foreign,
                publicKey: expect.stringMatching(
                  '75bb92ee197a5f5b645669b26b933558870d72791860e4854a41d6bb28e7d61c',
                ),
                url: expect.stringMatching('http://localhost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom1.createdAt.toISOString(),
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

        foreignCom1 = DbFederatedCommunity.create()
        foreignCom1.foreign = true
        foreignCom1.publicKey = Buffer.from(
          '08520bf2990274f829d2a2d45c802e4e854a768ed1c757ea99571a24bbfd87b2',
          'hex',
        )
        foreignCom1.apiVersion = '1_0'
        foreignCom1.endPoint = 'http://remotehost/api'
        foreignCom1.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom1)

        foreignCom2 = DbFederatedCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.publicKey = Buffer.from(
          '43c72cb81416121f5eb98affa4fb3360088719e80db6aaa13ff7e74d3f669307',
          'hex',
        )
        foreignCom2.apiVersion = '1_1'
        foreignCom2.endPoint = 'http://remotehost/api'
        foreignCom2.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom2)

        foreignCom3 = DbFederatedCommunity.create()
        foreignCom3.foreign = true
        foreignCom3.publicKey = Buffer.from(
          '4e3bf9536f694124c527b0aaf45aa6aea6c8c5d570d96b54f56f583724212b73',
          'hex',
        )
        foreignCom3.apiVersion = '1_2'
        foreignCom3.endPoint = 'http://remotehost/api'
        foreignCom3.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom3)
      })

      it('returns 3 home community and 3 foreign community entries', async () => {
        await expect(query({ query: getCommunities })).resolves.toMatchObject({
          data: {
            getCommunities: [
              {
                id: 3,
                foreign: homeCom3.foreign,
                publicKey: expect.stringMatching(homeCom3.publicKey.toString('hex')),
                url: expect.stringMatching('http://localhost/api/2_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom3.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 2,
                foreign: homeCom2.foreign,
                publicKey: expect.stringMatching(homeCom2.publicKey.toString('hex')),
                url: expect.stringMatching('http://localhost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 1,
                foreign: homeCom1.foreign,
                publicKey: expect.stringMatching(homeCom1.publicKey.toString('hex')),
                url: expect.stringMatching('http://localhost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: homeCom1.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 6,
                foreign: foreignCom3.foreign,
                publicKey: expect.stringMatching(
                  '4e3bf9536f694124c527b0aaf45aa6aea6c8c5d570d96b54f56f583724212b73',
                ),
                url: expect.stringMatching('http://remotehost/api/1_2'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: foreignCom3.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 5,
                foreign: foreignCom2.foreign,
                publicKey: expect.stringMatching(
                  '43c72cb81416121f5eb98affa4fb3360088719e80db6aaa13ff7e74d3f669307',
                ),
                url: expect.stringMatching('http://remotehost/api/1_1'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: foreignCom2.createdAt.toISOString(),
                updatedAt: null,
              },
              {
                id: 4,
                foreign: foreignCom1.foreign,
                publicKey: expect.stringMatching(
                  '08520bf2990274f829d2a2d45c802e4e854a768ed1c757ea99571a24bbfd87b2',
                ),
                url: expect.stringMatching('http://remotehost/api/1_0'),
                lastAnnouncedAt: null,
                verifiedAt: null,
                lastErrorAt: null,
                createdAt: foreignCom1.createdAt.toISOString(),
                updatedAt: null,
              },
            ],
          },
        })
      })
    })
  })

  describe('communities', () => {
    let homeCom1: DbCommunity
    let foreignCom1: DbCommunity
    let foreignCom2: DbCommunity

    describe('with empty list', () => {
      beforeEach(async () => {
        await cleanDB()
        jest.clearAllMocks()
      })

      it('returns no community entry', async () => {
        // const result: Community[] = await query({ query: getCommunities })
        // expect(result.length).toEqual(0)
        await expect(query({ query: communities })).resolves.toMatchObject({
          data: {
            communities: [],
          },
        })
      })
    })

    describe('with one home-community entry', () => {
      beforeEach(async () => {
        await cleanDB()
        jest.clearAllMocks()

        homeCom1 = DbCommunity.create()
        homeCom1.foreign = false
        homeCom1.url = 'http://localhost/api'
        homeCom1.publicKey = Buffer.from(
          '75bb92ee197a5f5b645669b26b933558870d72791860e4854a41d6bb28e7d61c',
          'hex',
        )
        homeCom1.privateKey = Buffer.from(
          'ddfa39122c9b1951da10a773fc0d3d020e770d89afb489691e247e08c2b7b8aa990b7dda99c5ec5df88bd9a94bc34e2e68a91d05a224ef88fa916e5a1fbb47cb',
          'hex',
        )
        homeCom1.communityUuid = 'HomeCom-UUID'
        homeCom1.authenticatedAt = new Date()
        homeCom1.name = 'HomeCommunity-name'
        homeCom1.description = 'HomeCommunity-description'
        homeCom1.creationDate = new Date()
        await DbCommunity.insert(homeCom1)
      })

      it('returns 1 home-community entry', async () => {
        await expect(query({ query: communities })).resolves.toMatchObject({
          data: {
            communities: [
              {
                id: expect.any(Number),
                foreign: homeCom1.foreign,
                name: homeCom1.name,
                description: homeCom1.description,
                url: homeCom1.url,
                creationDate: homeCom1.creationDate?.toISOString(),
                uuid: homeCom1.communityUuid,
                authenticatedAt: homeCom1.authenticatedAt?.toISOString(),
              },
            ],
          },
        })
      })
    })

    describe('returns 2 filtered communities even with 3 existing entries', () => {
      beforeEach(async () => {
        await cleanDB()
        jest.clearAllMocks()

        homeCom1 = DbCommunity.create()
        homeCom1.foreign = false
        homeCom1.url = 'http://localhost/api'
        homeCom1.publicKey = Buffer.from(
          '75bb92ee197a5f5b645669b26b933558870d72791860e4854a41d6bb28e7d61c',
          'hex',
        )
        homeCom1.privateKey = Buffer.from(
          'ddfa39122c9b1951da10a773fc0d3d020e770d89afb489691e247e08c2b7b8aa990b7dda99c5ec5df88bd9a94bc34e2e68a91d05a224ef88fa916e5a1fbb47cb',
          'hex',
        )
        homeCom1.communityUuid = 'HomeCom-UUID'
        homeCom1.authenticatedAt = new Date()
        homeCom1.name = 'HomeCommunity-name'
        homeCom1.description = 'HomeCommunity-description'
        homeCom1.creationDate = new Date()
        await DbCommunity.insert(homeCom1)

        foreignCom1 = DbCommunity.create()
        foreignCom1.foreign = true
        foreignCom1.url = 'http://stage-2.gradido.net/api'
        foreignCom1.publicKey = Buffer.from(
          '08520bf2990274f829d2a2d45c802e4e854a768ed1c757ea99571a24bbfd87b2',
          'hex',
        )
        foreignCom1.privateKey = Buffer.from(
          'd967220052995169b20b89a0c6190ee8aa9ca501d7a6df81c49a97003edca2ed724d69eaf55e62290d699d7c3ec8b44985fffd57def98d51b2202f2bd82330b3',
          'hex',
        )
        // foreignCom1.communityUuid = 'Stage2-Com-UUID'
        // foreignCom1.authenticatedAt = new Date()
        foreignCom1.name = 'Stage-2_Community-name'
        foreignCom1.description = 'Stage-2_Community-description'
        foreignCom1.creationDate = new Date()
        await DbCommunity.insert(foreignCom1)

        foreignCom2 = DbCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.url = 'http://stage-3.gradido.net/api'
        foreignCom2.publicKey = Buffer.from(
          '43c72cb81416121f5eb98affa4fb3360088719e80db6aaa13ff7e74d3f669307',
          'hex',
        )
        foreignCom2.privateKey = Buffer.from(
          '0ae8921a204bd27e1ba834ffa2f4480cca867b4def783934f3032e19c54d6e7c9fb3233eff07a0086f6bd8486e7220136ce941abdd51d268bfaca0cc3181f162',
          'hex',
        )
        foreignCom2.communityUuid = 'Stage3-Com-UUID'
        foreignCom2.authenticatedAt = new Date()
        foreignCom2.name = 'Stage-3_Community-name'
        foreignCom2.description = 'Stage-3_Community-description'
        foreignCom2.creationDate = new Date()
        await DbCommunity.insert(foreignCom2)
      })

      it('returns 2 community entries', async () => {
        await expect(query({ query: communities })).resolves.toMatchObject({
          data: {
            communities: [
              {
                id: expect.any(Number),
                foreign: homeCom1.foreign,
                name: homeCom1.name,
                description: homeCom1.description,
                url: homeCom1.url,
                creationDate: homeCom1.creationDate?.toISOString(),
                uuid: homeCom1.communityUuid,
                authenticatedAt: homeCom1.authenticatedAt?.toISOString(),
              },
              /*
              {
                id: expect.any(Number),
                foreign: foreignCom1.foreign,
                name: foreignCom1.name,
                description: foreignCom1.description,
                url: foreignCom1.url,
                creationDate: foreignCom1.creationDate?.toISOString(),
                uuid: foreignCom1.communityUuid,
                authenticatedAt: foreignCom1.authenticatedAt?.toISOString(),
              },
              */
              {
                id: expect.any(Number),
                foreign: foreignCom2.foreign,
                name: foreignCom2.name,
                description: foreignCom2.description,
                url: foreignCom2.url,
                creationDate: foreignCom2.creationDate?.toISOString(),
                uuid: foreignCom2.communityUuid,
                authenticatedAt: foreignCom2.authenticatedAt?.toISOString(),
              },
            ],
          },
        })
      })
    })
  })
})
