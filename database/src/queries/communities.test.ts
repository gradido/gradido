import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { createKeyPair, Ed25519PublicKey, MissingHomeCommunityError } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { communitiesTable } from '../schemas'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import {
  dbInsertHomeCommunity,
  dbIsMatchingKeyingActive,
  dbSelectAuthenticatedForeignCommunities,
  dbSelectHomeCommunity,
  dbUpdateHomeCommunity,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
  getHomeCommunityDrizzle,
  getHomeCommunityWithFederatedCommunityOrFail,
  getReachableCommunities,
  resetHomeCommunityCache,
} from './communities'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('community.queries', () => {
  // clean db for every test case
  beforeEach(async () => {
    await DbCommunity.clear()
    await DbFederatedCommunity.clear()
    resetHomeCommunityCache()
  })
  describe('getHomeCommunity', () => {
    it('should return null if no home community exists', async () => {
      await createCommunity(true)
      expect(await getHomeCommunity()).toBeNull()
    })
    it('should return the home community', async () => {
      const homeCom = await createCommunity(false)
      const community = await getHomeCommunity()
      expect(community).toBeDefined()
      expect(community?.name).toBe(homeCom.name)
      expect(community?.description).toBe(homeCom.description)
      expect(community?.url).toBe(homeCom.url)
      expect(community?.creationDate).toStrictEqual(homeCom.creationDate)
      expect(community?.communityUuid).toBe(homeCom.communityUuid)
      expect(community?.authenticatedAt).toStrictEqual(homeCom.authenticatedAt)
      expect(community?.foreign).toBe(homeCom.foreign)
      expect(community?.publicKey).toStrictEqual(homeCom.publicKey)
      expect(community?.privateKey).toStrictEqual(homeCom.privateKey)
    })
  })
  describe('dbSelectHomeCommunity', () => {
    it('returns null if no home community exists', async () => {
      await createCommunity(true)
      expect(await dbSelectHomeCommunity()).toBeNull()
    })
    it('returns the home community', async () => {
      const homeCom = await createCommunity(false)
      expect(await dbSelectHomeCommunity()).toMatchObject({
        id: homeCom.id,
        foreign: false,
        communityUuid: homeCom.communityUuid,
        publicKey: homeCom.publicKey,
        privateKey: homeCom.privateKey,
      })
    })
  })
  describe('dbInsertHomeCommunity', () => {
    const homeCommunityInput = async () => {
      const jwtKeyPair = await createKeyPair()
      return {
        publicKey: randomBytes(32),
        privateKey: randomBytes(64),
        communityUuid: uuidv4(),
        url: 'http://localhost/api/',
        name: 'HomeCommunity-name',
        description: 'HomeCommunity-description',
        creationDate: new Date('2026-01-01T12:00:00.000Z'),
        publicJwtKey: jwtKeyPair.publicKey,
        privateJwtKey: jwtKeyPair.privateKey,
      }
    }

    it('inserts the home community as not foreign', async () => {
      const input = await homeCommunityInput()
      await dbInsertHomeCommunity(input)
      const rows = await DbCommunity.find()
      expect(rows).toEqual([
        expect.objectContaining({
          ...input,
          id: expect.any(Number),
          foreign: false,
          createdAt: expect.any(Date),
          updatedAt: null,
        }),
      ])
    })
    it('throws on invalid input and inserts nothing', async () => {
      const input = await homeCommunityInput()
      await expect(
        dbInsertHomeCommunity({ ...input, publicKey: randomBytes(16) }),
      ).rejects.toThrow()
      expect(await DbCommunity.count()).toBe(0)
    })
    it('is visible through the cached getter afterwards', async () => {
      // "no home community" is not cached, the next call reads again
      await expect(getHomeCommunityDrizzle()).rejects.toBeInstanceOf(MissingHomeCommunityError)
      const input = await homeCommunityInput()
      await dbInsertHomeCommunity(input)
      expect(await getHomeCommunityDrizzle()).toMatchObject({
        communityUuid: input.communityUuid,
      })
    })
  })
  describe('dbUpdateHomeCommunity', () => {
    it('updates only the given fields and sets updatedAt', async () => {
      const homeCom = await createCommunity(false)
      await dbUpdateHomeCommunity({ name: 'new name', url: 'http://new/api/' })
      const updated = await DbCommunity.findOneByOrFail({ id: homeCom.id })
      expect(updated).toEqual({
        ...homeCom,
        name: 'new name',
        url: 'http://new/api/',
        updatedAt: expect.any(Date),
      })
    })
    it('leaves other communities alone', async () => {
      const foreign = await createCommunity(true)
      await createCommunity(false)
      await dbUpdateHomeCommunity({ name: 'new name' })
      expect(await DbCommunity.findOneByOrFail({ id: foreign.id })).toEqual(foreign)
    })
    it('throws MissingHomeCommunityError without a home community', async () => {
      await createCommunity(true)
      await expect(dbUpdateHomeCommunity({ name: 'new name' })).rejects.toBeInstanceOf(
        MissingHomeCommunityError,
      )
    })
    it('writes a location and reads it back as GeoJSON point', async () => {
      await createCommunity(false)
      await dbUpdateHomeCommunity({ location: { type: 'Point', coordinates: [13.4, 52.5] } })
      expect((await dbSelectHomeCommunity())?.location).toEqual({
        type: 'Point',
        coordinates: [13.4, 52.5],
      })
    })
    it('invalidates the cached home community', async () => {
      await createCommunity(false)
      expect((await getHomeCommunityDrizzle())?.name).toBe('HomeCommunity-name')
      await dbUpdateHomeCommunity({ name: 'new name' })
      expect((await getHomeCommunityDrizzle())?.name).toBe('new name')
    })
  })
  describe('dbIsMatchingKeyingActive', () => {
    it('is off for a community that was never switched on', async () => {
      // The state every existing row is in after migration 0127, and the reason the
      // column exists: the first keying run works through the whole backlog and pays
      // per entry, so somebody has to say when that starts.
      await createCommunity(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('is turned on and off again through dbUpdateHomeCommunity', async () => {
      // The write the admin panel uses. It clears the cached home community, which
      // dbIsMatchingKeyingActive reads through.
      await createCommunity(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)

      await dbUpdateHomeCommunity({ matchingKeyingActive: true })
      expect(await dbIsMatchingKeyingActive()).toBe(true)

      await dbUpdateHomeCommunity({ matchingKeyingActive: false })
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('leaves a foreign community alone', async () => {
      // ⛔ Scoped to the home community, like the read. A foreign row is another
      // community's, and what they pay for is not ours to set.
      const foreign = await createCommunity(true)
      await createCommunity(false)

      await dbUpdateHomeCommunity({ matchingKeyingActive: true })

      const [row] = await drizzleDb()
        .select({ active: communitiesTable.matchingKeyingActive })
        .from(communitiesTable)
        .where(eq(communitiesTable.id, foreign.id))
      expect(row.active).toBe(false)
    })

    it('throws MissingHomeCommunityError when there is no home community at all', async () => {
      // Not answered as "off": without a home community the backend does not start
      // (backend/src/index.ts), so this is not a state the keying run meets.
      await createCommunity(true)
      await expect(dbIsMatchingKeyingActive()).rejects.toBeInstanceOf(MissingHomeCommunityError)
    })
  })
  describe('dbSelectAuthenticatedForeignCommunities', () => {
    const withJwtKey = async (community: DbCommunity): Promise<DbCommunity> => {
      community.publicJwtKey = 'a public jwt key'
      return await community.save()
    }

    it('finds the foreign communities through the handshake with a key and a uuid, and no other', async () => {
      // `createCommunity(true)` is already authenticated and has a uuid; each of the others
      // lacks exactly one part.
      const first = await withJwtKey(await createCommunity(true))
      await createCommunity(true) // no JWT key: nothing to seal a question with
      const notAuthenticated = await createCommunity(true)
      notAuthenticated.authenticatedAt = null
      await withJwtKey(notAuthenticated)
      const withoutUuid = await createCommunity(true)
      withoutUuid.communityUuid = null
      await withJwtKey(withoutUuid)
      const home = await createCommunity(false)
      home.authenticatedAt = new Date()
      await withJwtKey(home)
      const second = await withJwtKey(await createCommunity(true))

      const found = await dbSelectAuthenticatedForeignCommunities()

      expect(found.map((community) => community.id)).toEqual([first.id, second.id])
      // The entity itself, with what the question needs.
      expect(found[0].publicJwtKey).toBe('a public jwt key')
      expect(found[0].communityUuid).toBe(first.communityUuid)
    })

    it('finds none without such a community', async () => {
      await createCommunity(false)
      expect(await dbSelectAuthenticatedForeignCommunities()).toEqual([])
    })
  })

  describe('getHomeCommunityWithFederatedCommunityOrFail', () => {
    it('should return the home community with federated communities', async () => {
      const homeCom = await createCommunity(false)
      await createVerifiedFederatedCommunity('1_0', 100, homeCom)
      const community = await getHomeCommunityWithFederatedCommunityOrFail('1_0')
      expect(community).toBeDefined()
      expect(community?.federatedCommunities).toHaveLength(1)
    })

    it('should throw if no home community exists', async () => {
      expect(getHomeCommunityWithFederatedCommunityOrFail('1_0')).rejects.toThrow()
    })

    it('should throw if no federated community exists', async () => {
      await createCommunity(false)
      expect(getHomeCommunityWithFederatedCommunityOrFail('1_0')).rejects.toThrow()
    })

    it('load community by public key returned from getHomeCommunityWithFederatedCommunityOrFail', async () => {
      const homeCom = await createCommunity(false)
      await createVerifiedFederatedCommunity('1_0', 100, homeCom)
      const community = await getHomeCommunityWithFederatedCommunityOrFail('1_0')
      expect(community).toBeDefined()
      expect(community?.federatedCommunities).toHaveLength(1)
      const ed25519PublicKey = new Ed25519PublicKey(community.federatedCommunities![0].publicKey)
      const communityByPublicKey = await getCommunityByPublicKeyOrFail(ed25519PublicKey)
      expect(communityByPublicKey).toBeDefined()
      expect(communityByPublicKey?.communityUuid).toBe(homeCom.communityUuid)
    })
  })
  describe('getReachableCommunities', () => {
    it('home community counts also to reachable communities', async () => {
      await createCommunity(false)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign communities authenticated within chosen range', async () => {
      const com1 = await createCommunity(true)
      const com2 = await createCommunity(true)
      const com3 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      await createVerifiedFederatedCommunity('1_0', 500, com2)
      // outside of range
      await createVerifiedFederatedCommunity('1_0', 1200, com3)

      const communities = await getReachableCommunities(1000)
      expect(communities).toHaveLength(2)
      expect(communities[0].communityUuid).toBe(com1.communityUuid)
      expect(communities[1].communityUuid).toBe(com2.communityUuid)
    })
    it('multiple federated community api version, result in one community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      await createVerifiedFederatedCommunity('1_1', 100, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('multiple federated community api version one outside of range, result in one community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      // outside of range
      await createVerifiedFederatedCommunity('1_1', 1200, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign and home community', async () => {
      // home community
      await createCommunity(false)
      const com1 = await createCommunity(true)
      const com2 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 400, com1)
      await createVerifiedFederatedCommunity('1_0', 1200, com2)
      expect(await getReachableCommunities(1000)).toHaveLength(2)
    })
    it('not verified inside time frame federated community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 1200, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(0)
    })
  })
})
