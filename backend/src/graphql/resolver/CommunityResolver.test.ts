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
import { GraphQLError } from 'graphql/error/GraphQLError'
import { v4 as uuidv4 } from 'uuid'

import { cleanDB, testEnvironment } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'

import { userFactory } from '@/seeds/factory/user'
import { login, updateHomeCommunityQuery } from '@/seeds/graphql/mutations'
import { getCommunities, communitiesQuery, getCommunityByUuidQuery } from '@/seeds/graphql/queries'
import { peterLustig } from '@/seeds/users/peter-lustig'

import { getCommunity } from './util/communities'

// to do: We need a setup for the tests that closes the connection
let mutate: ApolloServerTestClient['mutate'],
  query: ApolloServerTestClient['query'],
  con: Connection

let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

const peterLoginData = {
  email: 'peter@lustig.de',
  password: 'Aa12345_',
  publisherId: 1234,
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await DbFederatedCommunity.clear()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

// real valid ed25519 key pairs
const ed25519KeyPairStaticHex = [
  {
    public: '264c1e88914d18166cc31e8d6c2111c03ac83f5910398eb45cd425c6c3836367',
    private:
      '0ddcafd5e2da92e171ccc974af22fee3ad8407475e330586c8f259837d4fedc6264c1e88914d18166cc31e8d6c2111c03ac83f5910398eb45cd425c6c3836367',
  },
  {
    public: 'ac18a8754f725079f93d27b9054f2eff536109a2fd439f9755941abdd639baf0',
    private:
      '45325a0d0f22655095321d9d05999c65245da02130318ff51da1ee423b836117ac18a8754f725079f93d27b9054f2eff536109a2fd439f9755941abdd639baf0',
  },
  {
    public: '6f7d4ccde610db1e1a33fabbb444d5400013c168296b03fd50bc686d4c1ad0ed',
    private:
      '8ab6d5da8b666ef5b3d754559c028806a1e2f8142a3e7ada411a8b6a3fe70eeb6f7d4ccde610db1e1a33fabbb444d5400013c168296b03fd50bc686d4c1ad0ed',
  },
  {
    public: '85fbbce0763db24677cf7cb579a743013557a4fea0a9a624245f3ae8cd785e1d',
    private:
      '0369ea7c80c3134c2872c3cf77a68f12d57de57359145b550e3a0c4c8170a31785fbbce0763db24677cf7cb579a743013557a4fea0a9a624245f3ae8cd785e1d',
  },
  {
    public: 'b099d023476ece01f231c269cbe496139ca73b3b4eb705816a511a1ca09661d0',
    private:
      '015ac650157b9e9bdbe718940606242daa318a251e8417b49440495e5afe3750b099d023476ece01f231c269cbe496139ca73b3b4eb705816a511a1ca09661d0',
  },
  {
    public: '9f8dc17f1af9f71e9b9a1cd49ca295b89049863515a487578ad4f90b307abf39',
    private:
      '0c13e71c55a3c03bd5df05c92bbccde88ad4a47f3bac6bdc5383ef1ec946cfdc9f8dc17f1af9f71e9b9a1cd49ca295b89049863515a487578ad4f90b307abf39',
  },
  {
    public: '34218b2f570d341370dd2db111d0ef2415c03a110c3bf3127c6b2337af71753a',
    private:
      '60f3479bba44d035886ac21c362bceece9f9ec81859c9b37f734b6442a06c93b34218b2f570d341370dd2db111d0ef2415c03a110c3bf3127c6b2337af71753a',
  },
  {
    public: 'a447404f5e04ed4896ed64d0f704574ed780b52e90868d4b83e1afb8ea687ff6',
    private:
      'ea85ebb4332a52d87fe6f322dcd23ad4afc5eafb93dfff2216f3ffa9f0730e8aa447404f5e04ed4896ed64d0f704574ed780b52e90868d4b83e1afb8ea687ff6',
  },
  {
    public: 'b8b987c55da62b30d929672520551033eb37abdd88f9ea104db5d107c19680b4',
    private:
      '29475dbbc96d694b3c653a1e143caf084f6daf2d35267522c4096c55b47e2b76b8b987c55da62b30d929672520551033eb37abdd88f9ea104db5d107c19680b4',
  },
  {
    public: '40203d18a6ff8fb3c4c62d78e4807036fc9207782ce97a9bcf3be0755c236c37',
    private:
      '0b5c4d536d222e88b561ea495e15918fb8cba61a3f8c261ec9e587cca560804040203d18a6ff8fb3c4c62d78e4807036fc9207782ce97a9bcf3be0755c236c37',
  },
]

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
        homeCom1.publicKey = Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex')
        homeCom1.apiVersion = '1_0'
        homeCom1.endPoint = 'http://localhost/api'
        homeCom1.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom1)

        homeCom2 = DbFederatedCommunity.create()
        homeCom2.foreign = false
        homeCom2.publicKey = Buffer.from(ed25519KeyPairStaticHex[1].public, 'hex')
        homeCom2.apiVersion = '1_1'
        homeCom2.endPoint = 'http://localhost/api'
        homeCom2.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom2)

        homeCom3 = DbFederatedCommunity.create()
        homeCom3.foreign = false
        homeCom3.publicKey = Buffer.from(ed25519KeyPairStaticHex[2].public, 'hex')
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[2].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[1].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[0].public),
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
        foreignCom1.publicKey = Buffer.from(ed25519KeyPairStaticHex[3].public, 'hex')
        foreignCom1.apiVersion = '1_0'
        foreignCom1.endPoint = 'http://remotehost/api'
        foreignCom1.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom1)

        foreignCom2 = DbFederatedCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.publicKey = Buffer.from(ed25519KeyPairStaticHex[4].public, 'hex')
        foreignCom2.apiVersion = '1_1'
        foreignCom2.endPoint = 'http://remotehost/api'
        foreignCom2.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom2)

        foreignCom3 = DbFederatedCommunity.create()
        foreignCom3.foreign = true
        foreignCom3.publicKey = Buffer.from(ed25519KeyPairStaticHex[5].public, 'hex')
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[2].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[1].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[0].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[5].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[4].public),
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
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[3].public),
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
        await expect(query({ query: communitiesQuery })).resolves.toMatchObject({
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
        homeCom1.publicKey = Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex')
        homeCom1.privateKey = Buffer.from(ed25519KeyPairStaticHex[0].private, 'hex')
        homeCom1.communityUuid = 'HomeCom-UUID'
        homeCom1.authenticatedAt = new Date()
        homeCom1.name = 'HomeCommunity-name'
        homeCom1.description = 'HomeCommunity-description'
        homeCom1.creationDate = new Date()
        await DbCommunity.insert(homeCom1)
      })

      it('returns 1 home-community entry', async () => {
        await expect(query({ query: communitiesQuery })).resolves.toMatchObject({
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
        homeCom1.publicKey = Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex')
        homeCom1.privateKey = Buffer.from(ed25519KeyPairStaticHex[0].private, 'hex')
        homeCom1.communityUuid = 'HomeCom-UUID'
        homeCom1.authenticatedAt = new Date()
        homeCom1.name = 'HomeCommunity-name'
        homeCom1.description = 'HomeCommunity-description'
        homeCom1.creationDate = new Date()
        await DbCommunity.insert(homeCom1)

        foreignCom1 = DbCommunity.create()
        foreignCom1.foreign = true
        foreignCom1.url = 'http://stage-2.gradido.net/api'
        foreignCom1.publicKey = Buffer.from(ed25519KeyPairStaticHex[3].public, 'hex')
        foreignCom1.privateKey = Buffer.from(ed25519KeyPairStaticHex[3].private, 'hex')
        // foreignCom1.communityUuid = 'Stage2-Com-UUID'
        // foreignCom1.authenticatedAt = new Date()
        foreignCom1.name = 'Stage-2_Community-name'
        foreignCom1.description = 'Stage-2_Community-description'
        foreignCom1.creationDate = new Date()
        await DbCommunity.insert(foreignCom1)

        foreignCom2 = DbCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.url = 'http://stage-3.gradido.net/api'
        foreignCom2.publicKey = Buffer.from(ed25519KeyPairStaticHex[4].public, 'hex')
        foreignCom2.privateKey = Buffer.from(ed25519KeyPairStaticHex[4].private, 'hex')
        foreignCom2.communityUuid = 'Stage3-Com-UUID'
        foreignCom2.authenticatedAt = new Date()
        foreignCom2.name = 'Stage-3_Community-name'
        foreignCom2.description = 'Stage-3_Community-description'
        foreignCom2.creationDate = new Date()
        await DbCommunity.insert(foreignCom2)
      })

      it('returns 2 community entries', async () => {
        await expect(query({ query: communitiesQuery })).resolves.toMatchObject({
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

    describe('search community by uuid', () => {
      let homeCom: DbCommunity | null
      beforeEach(async () => {
        await cleanDB()
        jest.clearAllMocks()
        const admin = await userFactory(testEnv, peterLustig)
        // login as admin
        await mutate({ mutation: login, variables: peterLoginData })

        // HomeCommunity is still created in userFactory
        homeCom = await getCommunity({ communityIdentifier: admin.communityUuid })

        foreignCom1 = DbCommunity.create()
        foreignCom1.foreign = true
        foreignCom1.url = 'http://stage-2.gradido.net/api'
        foreignCom1.publicKey = Buffer.from('publicKey-stage-2_Community')
        foreignCom1.privateKey = Buffer.from('privateKey-stage-2_Community')
        // foreignCom1.communityUuid = 'Stage2-Com-UUID'
        // foreignCom1.authenticatedAt = new Date()
        foreignCom1.name = 'Stage-2_Community-name'
        foreignCom1.description = 'Stage-2_Community-description'
        foreignCom1.creationDate = new Date()
        await DbCommunity.insert(foreignCom1)

        foreignCom2 = DbCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.url = 'http://stage-3.gradido.net/api'
        foreignCom2.publicKey = Buffer.from('publicKey-stage-3_Community')
        foreignCom2.privateKey = Buffer.from('privateKey-stage-3_Community')
        foreignCom2.communityUuid = uuidv4()
        foreignCom2.authenticatedAt = new Date()
        foreignCom2.name = 'Stage-3_Community-name'
        foreignCom2.description = 'Stage-3_Community-description'
        foreignCom2.creationDate = new Date()
        await DbCommunity.insert(foreignCom2)
      })

      it('finds the home-community', async () => {
        await expect(
          query({
            query: getCommunityByUuidQuery,
            variables: { communityIdentifier: homeCom?.communityUuid },
          }),
        ).resolves.toMatchObject({
          data: {
            community: {
              id: homeCom?.id,
              foreign: homeCom?.foreign,
              name: homeCom?.name,
              description: homeCom?.description,
              url: homeCom?.url,
              creationDate: homeCom?.creationDate?.toISOString(),
              uuid: homeCom?.communityUuid,
              authenticatedAt: homeCom?.authenticatedAt,
            },
          },
        })
      })

      it('updates the home-community gmsApiKey', async () => {
        await expect(
          mutate({
            mutation: updateHomeCommunityQuery,
            variables: { uuid: homeCom?.communityUuid, gmsApiKey: 'gmsApiKey' },
          }),
        ).resolves.toMatchObject({
          data: {
            updateHomeCommunity: {
              id: expect.any(Number),
              foreign: homeCom?.foreign,
              name: homeCom?.name,
              description: homeCom?.description,
              url: homeCom?.url,
              creationDate: homeCom?.creationDate?.toISOString(),
              uuid: homeCom?.communityUuid,
              authenticatedAt: homeCom?.authenticatedAt,
              gmsApiKey: 'gmsApiKey',
            },
          },
        })
      })

      it('throws error on updating a foreign-community', async () => {
        expect(
          await mutate({
            mutation: updateHomeCommunityQuery,
            variables: { uuid: foreignCom2.communityUuid, gmsApiKey: 'gmsApiKey' },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Error: Only the HomeCommunity could be modified!')],
          }),
        )
      })

      it('throws error on updating a community without uuid', async () => {
        expect(
          await mutate({
            mutation: updateHomeCommunityQuery,
            variables: { uuid: null, gmsApiKey: 'gmsApiKey' },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [
              new GraphQLError(`Variable "$uuid" of non-null type "String!" must not be null.`),
            ],
          }),
        )
      })

      it('throws error on updating a community with not existing uuid', async () => {
        expect(
          await mutate({
            mutation: updateHomeCommunityQuery,
            variables: { uuid: uuidv4(), gmsApiKey: 'gmsApiKey' },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('HomeCommunity with uuid not found: ')],
          }),
        )
      })
    })
  })
})
