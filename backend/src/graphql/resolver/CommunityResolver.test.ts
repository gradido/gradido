import { ApolloServerTestClient, cleanDB, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  CommunitiesSelect,
  createCommunity,
  createFederatedCommunity,
  createVerifiedFederatedCommunity,
  dbSelectHomeCommunity,
  FederatedCommunitiesSelect,
  getHomeCommunityDrizzle,
} from 'database'
import { GraphQLError } from 'graphql/error/GraphQLError'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import {
  login,
  updateHomeCommunityLocationQuery,
  updateHomeCommunityQuery,
} from '@/seeds/graphql/mutations'
import {
  allCommunities,
  getHomeCommunityQuery,
  reachableCommunities,
} from '@/seeds/graphql/queries'
import { peterLustig } from '@/seeds/users/peter-lustig'

CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER = 1000

// to do: We need a setup for the tests that closes the connection
let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

const peterLoginData = {
  email: 'peter@lustig.de',
  password: 'Aa12345_',
  publisherId: 1234,
}

beforeAll(async () => {
  testEnv = await testEnvironment(getLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await db.destroy()
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
  describe('allCommunities for admin', () => {
    let homeCom1: FederatedCommunitiesSelect
    let homeCom2: FederatedCommunitiesSelect
    let homeCom3: FederatedCommunitiesSelect
    let foreignCom1: FederatedCommunitiesSelect
    let foreignCom2: FederatedCommunitiesSelect
    let foreignCom3: FederatedCommunitiesSelect

    beforeAll(async () => {
      // create admin and login as admin
      await userFactoryDrizzle(peterLustig)
      await mutate({ mutation: login, variables: peterLoginData })
    })

    afterAll(async () => {
      await cleanDB()
    })

    describe('with empty list', () => {
      it('returns no community entry', async () => {
        // const result: Community[] = await query({ query: getCommunities })
        // expect(result.length).toEqual(0)
        await expect(query({ query: allCommunities })).resolves.toMatchObject({
          data: {
            allCommunities: [],
          },
        })
      })
    })

    describe('only home-community entries (different apis)', () => {
      beforeEach(async () => {
        homeCom1 = await createFederatedCommunity({
          foreign: false,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex'),
          apiVersion: '1_0',
          endPoint: 'http://localhost/api',
        })

        homeCom2 = await createFederatedCommunity({
          foreign: false,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex'),
          apiVersion: '1_1',
          endPoint: 'http://localhost/api',
        })

        homeCom3 = await createFederatedCommunity({
          foreign: false,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex'),
          apiVersion: '2_0',
          endPoint: 'http://localhost/api',
        })
      })

      it('returns only home-community entries', async () => {
        await expect(query({ query: allCommunities })).resolves.toMatchObject({
          data: {
            allCommunities: [
              {
                foreign: false,
                url: 'http://localhost',
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[0].public),
                authenticatedAt: null,
                createdAt: null,
                creationDate: null,
                description: null,
                gmsApiKey: null,
                name: null,
                updatedAt: null,
                uuid: null,
                federatedCommunities: [
                  {
                    id: homeCom3.id,
                    apiVersion: '2_0',
                    endPoint: 'http://localhost/api/',
                    createdAt: homeCom3.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                  {
                    id: homeCom2.id,
                    apiVersion: '1_1',
                    endPoint: 'http://localhost/api/',
                    createdAt: homeCom2.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                  {
                    id: homeCom1.id,
                    apiVersion: '1_0',
                    endPoint: 'http://localhost/api/',
                    createdAt: homeCom1.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                ],
              },
            ],
          },
        })
      })
    })
    describe('with 6 federated community entries', () => {
      let comHomeCom1: CommunitiesSelect
      let comForeignCom1: CommunitiesSelect
      let comForeignCom2: CommunitiesSelect
      let foreignCom4: FederatedCommunitiesSelect

      beforeEach(async () => {
        comHomeCom1 = await createCommunity(false, {
          url: 'http://localhost',
          publicKey: Buffer.from(ed25519KeyPairStaticHex[0].public, 'hex'),
          privateKey: Buffer.from(ed25519KeyPairStaticHex[0].private, 'hex'),
          communityUuid: 'HomeCom-UUID',
          authenticatedAt: new Date(),
          name: 'HomeCommunity-name',
          description: 'HomeCommunity-description',
        })

        comForeignCom1 = await createCommunity(true, {
          url: 'http://stage-2.gradido.net',
          publicKey: Buffer.from(ed25519KeyPairStaticHex[3].public, 'hex'),
          privateKey: Buffer.from(ed25519KeyPairStaticHex[3].private, 'hex'),
          // community_uuid is NOT NULL since migration 0162; not authenticated all the same
          communityUuid: 'Stage2-Com-UUID',
          authenticatedAt: null,
          name: 'Stage-2_Community-name',
          description: 'Stage-2_Community-description',
        })

        comForeignCom2 = await createCommunity(true, {
          url: 'http://stage-3.gradido.net',
          publicKey: Buffer.from(ed25519KeyPairStaticHex[4].public, 'hex'),
          privateKey: Buffer.from(ed25519KeyPairStaticHex[4].private, 'hex'),
          communityUuid: 'Stage3-Com-UUID',
          authenticatedAt: new Date(),
          name: 'Stage-3_Community-name',
          description: 'Stage-3_Community-description',
        })

        foreignCom1 = await createFederatedCommunity({
          foreign: true,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[3].public, 'hex'),
          apiVersion: '1_0',
          endPoint: 'http://remotehost/api',
        })

        foreignCom2 = await createFederatedCommunity({
          foreign: true,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[4].public, 'hex'),
          apiVersion: '1_1',
          endPoint: 'http://remotehost/api',
        })

        foreignCom3 = await createFederatedCommunity({
          foreign: true,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[5].public, 'hex'),
          apiVersion: '2_0',
          endPoint: 'http://remotehost/api',
        })

        foreignCom4 = await createFederatedCommunity({
          foreign: true,
          publicKey: Buffer.from(ed25519KeyPairStaticHex[5].public, 'hex'),
          apiVersion: '1_0',
          endPoint: 'http://remotehost/api',
        })
      })

      it('return communities structured for admin ', async () => {
        await expect(query({ query: allCommunities })).resolves.toMatchObject({
          data: {
            allCommunities: [
              {
                foreign: false,
                url: 'http://localhost',
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[0].public),
                authenticatedAt: comHomeCom1.authenticatedAt?.toISOString(),
                createdAt: comHomeCom1.createdAt.toISOString(),
                creationDate: comHomeCom1.creationDate?.toISOString(),
                description: comHomeCom1.description,
                gmsApiKey: null,
                name: comHomeCom1.name,
                updatedAt: null,
                uuid: comHomeCom1.communityUuid,
                federatedCommunities: [
                  {
                    id: homeCom3.id,
                    apiVersion: '2_0',
                    endPoint: 'http://localhost/api/',
                    createdAt: homeCom3.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                  {
                    id: homeCom2.id,
                    apiVersion: '1_1',
                    endPoint: 'http://localhost/api/',
                    createdAt: homeCom2.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                  {
                    id: homeCom1.id,
                    apiVersion: '1_0',
                    endPoint: 'http://localhost/api/',
                    createdAt: homeCom1.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                ],
              },
              {
                foreign: true,
                url: 'http://remotehost',
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[5].public),
                authenticatedAt: null,
                createdAt: null,
                creationDate: null,
                description: null,
                gmsApiKey: null,
                name: null,
                updatedAt: null,
                uuid: null,
                federatedCommunities: [
                  {
                    id: foreignCom4.id,
                    apiVersion: '1_0',
                    endPoint: 'http://remotehost/api/',
                    createdAt: foreignCom4.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                  {
                    id: foreignCom3.id,
                    apiVersion: '2_0',
                    endPoint: 'http://remotehost/api/',
                    createdAt: foreignCom3.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                ],
              },
              {
                foreign: true,
                url: 'http://stage-3.gradido.net',
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[4].public),
                authenticatedAt: comForeignCom2.authenticatedAt?.toISOString(),
                createdAt: comForeignCom2.createdAt.toISOString(),
                creationDate: comForeignCom2.creationDate?.toISOString(),
                description: comForeignCom2.description,
                gmsApiKey: null,
                name: comForeignCom2.name,
                updatedAt: null,
                uuid: comForeignCom2.communityUuid,
                federatedCommunities: [
                  {
                    id: foreignCom2.id,
                    apiVersion: '1_1',
                    endPoint: 'http://remotehost/api/',
                    createdAt: foreignCom2.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                ],
              },
              {
                foreign: true,
                url: 'http://stage-2.gradido.net',
                publicKey: expect.stringMatching(ed25519KeyPairStaticHex[3].public),
                authenticatedAt: null,
                createdAt: comForeignCom1.createdAt.toISOString(),
                creationDate: comForeignCom1.creationDate?.toISOString(),
                description: comForeignCom1.description,
                gmsApiKey: null,
                name: comForeignCom1.name,
                updatedAt: null,
                uuid: comForeignCom1.communityUuid,
                federatedCommunities: [
                  {
                    id: foreignCom1.id,
                    apiVersion: '1_0',
                    endPoint: 'http://remotehost/api/',
                    createdAt: foreignCom1.createdAt.toISOString(),
                    lastAnnouncedAt: null,
                    lastErrorAt: null,
                    updatedAt: null,
                    verifiedAt: null,
                  },
                ],
              },
            ],
          },
        })
      })
    })
  })

  describe('reachableCommunities', () => {
    let homeCom1: CommunitiesSelect
    let foreignCom1: CommunitiesSelect
    let foreignCom2: CommunitiesSelect

    afterAll(async () => {
      await cleanDB()
    })

    describe('with empty list', () => {
      it('returns no community entry', async () => {
        await expect(query({ query: reachableCommunities })).resolves.toMatchObject({
          data: {
            reachableCommunities: [],
          },
        })
      })
    })

    describe('with one home-community entry', () => {
      beforeEach(async () => {
        homeCom1 = await createCommunity(false)
      })

      it('returns 1 home-community entry', async () => {
        await expect(query({ query: reachableCommunities })).resolves.toMatchObject({
          data: {
            reachableCommunities: [
              {
                foreign: homeCom1.foreign,
                name: homeCom1.name,
                description: homeCom1.description,
                url: homeCom1.url,
                uuid: homeCom1.communityUuid,
              },
            ],
          },
        })
      })
    })

    describe('returns 2 filtered communities even with 3 existing entries', () => {
      beforeEach(async () => {
        foreignCom1 = await createCommunity(true)
        foreignCom2 = await createCommunity(true)
        await createVerifiedFederatedCommunity('1_0', 100, foreignCom1)
        await createVerifiedFederatedCommunity('1_1', 100, foreignCom1)
        await createVerifiedFederatedCommunity('1_0', 10000, foreignCom2)
      })

      it('returns 2 community entries', async () => {
        const result = await query({ query: reachableCommunities })
        expect(result.data.reachableCommunities.length).toBe(2)
        expect(result.data.reachableCommunities).toMatchObject([
          {
            foreign: homeCom1.foreign,
            name: homeCom1.name,
            description: homeCom1.description,
            url: homeCom1.url,
            uuid: homeCom1.communityUuid,
          },
          {
            foreign: foreignCom1.foreign,
            name: foreignCom1.name,
            description: foreignCom1.description,
            url: foreignCom1.url,
            uuid: foreignCom1.communityUuid,
          },
        ])
      })
    })

    describe('homeCommunity', () => {
      let homeCom: CommunitiesSelect | null
      beforeAll(async () => {
        await cleanDB()

        homeCom = await createCommunity(false)
        foreignCom1 = await createCommunity(true)
        foreignCom2 = await createCommunity(true)
      })

      it('finds the home-community', async () => {
        await expect(
          query({
            query: getHomeCommunityQuery,
          }),
        ).resolves.toMatchObject({
          data: {
            homeCommunity: {
              id: homeCom?.id,
              foreign: homeCom?.foreign,
              name: homeCom?.name,
              description: homeCom?.description,
              url: homeCom?.url,
              creationDate: homeCom?.creationDate?.toISOString(),
              uuid: homeCom?.communityUuid,
            },
          },
        })
      })
    })
  })

  describe('update community', () => {
    let homeCom: CommunitiesSelect
    let foreignCom2: CommunitiesSelect

    beforeAll(async () => {
      await cleanDB()

      // create admin and login as admin
      await userFactoryDrizzle(peterLustig)
      homeCom = await getHomeCommunityDrizzle()
      await createCommunity(true)
      foreignCom2 = await createCommunity(true)
      await mutate({ mutation: login, variables: peterLoginData })
    })

    afterAll(async () => {
      await cleanDB()
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

    describe('location', () => {
      const setLocation = (location: { longitude: number; latitude: number } | null) =>
        mutate({
          mutation: updateHomeCommunityLocationQuery,
          variables: { uuid: homeCom.communityUuid, location },
        })

      it('stores a new location', async () => {
        await setLocation({ longitude: 13, latitude: 52 })
        const stored = await dbSelectHomeCommunity()
        expect(stored?.location).toEqual({ type: 'Point', coordinates: [13, 52] })
        expect(stored?.updatedAt).toEqual(expect.any(Date))
      })

      it('does not write the same location again', async () => {
        await setLocation({ longitude: 13, latitude: 52 })
        const before = await dbSelectHomeCommunity()
        await setLocation({ longitude: 13, latitude: 52 })
        expect(await dbSelectHomeCommunity()).toEqual(before)
      })

      it('stores a changed location', async () => {
        await setLocation({ longitude: 13, latitude: 52 })
        await setLocation({ longitude: 14, latitude: 53 })
        expect((await dbSelectHomeCommunity())?.location).toEqual({
          type: 'Point',
          coordinates: [14, 53],
        })
      })

      it('removes the location with null', async () => {
        await setLocation({ longitude: 13, latitude: 52 })
        await setLocation(null)
        expect((await dbSelectHomeCommunity())?.location).toBeNull()
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
