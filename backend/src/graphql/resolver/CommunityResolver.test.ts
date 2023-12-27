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

import { cleanDB, testEnvironment } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'

import { userFactory } from '@/seeds/factory/user'
import { login, updateHomeCommunityQuery } from '@/seeds/graphql/mutations'
import { getCommunities, communitiesQuery, getCommunityByUuidQuery } from '@/seeds/graphql/queries'
import { peterLustig } from '@/seeds/users/peter-lustig'

import { getCommunityByUuid } from './util/communities'

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
        homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom1.apiVersion = '1_0'
        homeCom1.endPoint = 'http://localhost/api'
        homeCom1.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom1)

        homeCom2 = DbFederatedCommunity.create()
        homeCom2.foreign = false
        homeCom2.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom2.apiVersion = '1_1'
        homeCom2.endPoint = 'http://localhost/api'
        homeCom2.createdAt = new Date()
        await DbFederatedCommunity.insert(homeCom2)

        homeCom3 = DbFederatedCommunity.create()
        homeCom3.foreign = false
        homeCom3.publicKey = Buffer.from('publicKey-HomeCommunity')
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
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
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
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
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
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
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
        foreignCom1.publicKey = Buffer.from('publicKey-ForeignCommunity')
        foreignCom1.apiVersion = '1_0'
        foreignCom1.endPoint = 'http://remotehost/api'
        foreignCom1.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom1)

        foreignCom2 = DbFederatedCommunity.create()
        foreignCom2.foreign = true
        foreignCom2.publicKey = Buffer.from('publicKey-ForeignCommunity')
        foreignCom2.apiVersion = '1_1'
        foreignCom2.endPoint = 'http://remotehost/api'
        foreignCom2.createdAt = new Date()
        await DbFederatedCommunity.insert(foreignCom2)

        foreignCom3 = DbFederatedCommunity.create()
        foreignCom3.foreign = true
        foreignCom3.publicKey = Buffer.from('publicKey-ForeignCommunity')
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
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
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
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
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
                publicKey: expect.stringMatching('publicKey-HomeCommunity'),
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
                publicKey: expect.stringMatching('publicKey-ForeignCommunity'),
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
                publicKey: expect.stringMatching('publicKey-ForeignCommunity'),
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
                publicKey: expect.stringMatching('publicKey-ForeignCommunity'),
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
        homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom1.privateKey = Buffer.from('privateKey-HomeCommunity')
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
        homeCom1.publicKey = Buffer.from('publicKey-HomeCommunity')
        homeCom1.privateKey = Buffer.from('privateKey-HomeCommunity')
        homeCom1.communityUuid = 'HomeCom-UUID'
        homeCom1.authenticatedAt = new Date()
        homeCom1.name = 'HomeCommunity-name'
        homeCom1.description = 'HomeCommunity-description'
        homeCom1.creationDate = new Date()
        await DbCommunity.insert(homeCom1)

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
        homeCom = await getCommunityByUuid(admin.communityUuid)

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
        foreignCom2.communityUuid = 'Stage3-Com-UUID'
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
            variables: { communityUuid: homeCom?.communityUuid },
          }),
        ).resolves.toMatchObject({
          data: {
            getCommunityByUuid: {
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
            variables: { uuid: 'unknownUuid', gmsApiKey: 'gmsApiKey' },
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
