import { eq } from 'drizzle-orm'
import { Ed25519PublicKey } from 'shared'
import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { communitiesTable } from '../schemas'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import {
  dbIsMatchingKeyingActive,
  dbSetMatchingKeyingActive,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
  getHomeCommunityWithFederatedCommunityOrFail,
  getReachableCommunities,
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
  describe('dbIsMatchingKeyingActive', () => {
    // Flipped through drizzle, not through the TypeORM entity: the entity does not map
    // this column (new code goes to drizzle, AGENTS.md), and `synchronize: false` means
    // it never notices. Writing it the same way it is read is also what makes the test
    // exercise the real mapping.
    const setSwitch = async (id: number, on: boolean) =>
      await drizzleDb()
        .update(communitiesTable)
        .set({ matchingKeyingActive: on ? 1 : 0 })
        .where(eq(communitiesTable.id, id))

    it('is off for a community that was never switched on', async () => {
      // The state every existing row is in after migration 0127, and the reason the
      // column exists: the first keying run works through the whole backlog and pays
      // per entry, so somebody has to say when that starts.
      await createCommunity(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('is on once the community says so', async () => {
      const homeCom = await createCommunity(false)
      await setSwitch(homeCom.id, true)
      expect(await dbIsMatchingKeyingActive()).toBe(true)
    })

    it('reads it again rather than answering from the first read', async () => {
      // ⚠️ The whole point of the column. `getHomeCommunityDrizzle` caches the
      // community for the life of the process and never invalidates, so a value read
      // through it would answer with whatever was true at startup - and a switch that
      // only changes on restart is not a switch.
      const homeCom = await createCommunity(false)
      await setSwitch(homeCom.id, true)
      expect(await dbIsMatchingKeyingActive()).toBe(true)

      await setSwitch(homeCom.id, false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('is turned on and off again through its own write', async () => {
      // The write the admin panel uses. Column-targeted rather than a `save()` of the
      // community: the row is read and written all over the codebase, and a
      // whole-entity write would carry back whatever the caller happened to hold.
      await createCommunity(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)

      await dbSetMatchingKeyingActive(true)
      expect(await dbIsMatchingKeyingActive()).toBe(true)

      await dbSetMatchingKeyingActive(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('leaves a foreign community alone', async () => {
      // ⛔ Scoped to the home community, like the read. A foreign row is another
      // community's, and what they pay for is not ours to set.
      const foreign = await createCommunity(true)
      await createCommunity(false)

      await dbSetMatchingKeyingActive(true)

      const [row] = await drizzleDb()
        .select({ active: communitiesTable.matchingKeyingActive })
        .from(communitiesTable)
        .where(eq(communitiesTable.id, foreign.id))
      expect(row.active).toBe(0)
    })

    it('is off when there is no home community at all', async () => {
      // Nobody to bill and nobody who decided reads the same as "not switched on".
      // Throwing here would turn a run that should quietly stay off into an error on
      // a timer.
      await createCommunity(true)
      expect(await dbIsMatchingKeyingActive()).toBe(false)
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
