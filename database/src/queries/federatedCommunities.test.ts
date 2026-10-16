// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { FederatedCommunitiesInsert, federatedCommunitiesTable } from '../schemas'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import {
  dbClearFederatedCommunities,
  dbFindFederatedCommunitiesNotVerified,
  dbFindFederatedCommunityByPublicKeyAndApi,
  dbUpdateFederatedCommunitiesVerified,
} from './federatedCommunities'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('federatedCommunities.queries', () => {
  beforeEach(async () => {
    await dbDeleteAllRowsExceptMigrations()
  })

  describe('dbFindFederatedCommunityByPublicKeyAndApi', () => {
    it('finds the entry of that community for that API version', async () => {
      const community = await createCommunity(true)
      const entry = await createVerifiedFederatedCommunity('1_0', 0, community)

      const found = await dbFindFederatedCommunityByPublicKeyAndApi(community.publicKey, '1_0')
      if (!found.success) {
        throw new Error(`expected the entry, got ${found.error.message}`)
      }
      expect(found.value.id).toBe(entry.id)
      expect(found.value.apiVersion).toBe('1_0')
      expect(found.value.endPoint).toBe(community.url)
    })

    // A community announces one entry per API version it serves, and a caller that sends on
    // one version must not be handed the endpoint of another.
    it('does not hand out the entry of another API version', async () => {
      const community = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_1', 0, community)

      const found = await dbFindFederatedCommunityByPublicKeyAndApi(community.publicKey, '1_0')
      expect(found.success).toBe(false)
    })

    // The key is the whole identity here: the entry of another community on the same version
    // must not answer for this one.
    it('does not hand out the entry of another community', async () => {
      const community = await createCommunity(true)
      const other = await createCommunity(true)
      const otherEntry = await createVerifiedFederatedCommunity('1_0', 0, other)

      const found = await dbFindFederatedCommunityByPublicKeyAndApi(community.publicKey, '1_0')
      expect(found.success).toBe(false)
      // The fixture proves itself: the other entry is there, it is just not this community's.
      const control = await dbFindFederatedCommunityByPublicKeyAndApi(other.publicKey, '1_0')
      expect(control.success && control.value.id).toBe(otherEntry.id)
    })

    it('says not found instead of throwing when there is no entry at all', async () => {
      const community = await createCommunity(true)

      const found = await dbFindFederatedCommunityByPublicKeyAndApi(community.publicKey, '1_0')
      if (found.success) {
        throw new Error('expected no entry')
      }
      expect(found.error).toBeInstanceOf(DBNotFoundError)
      expect(found.error.table).toBe('federated_communities')
    })
  })

  // an entry as the dht-node writes it on an announcement
  const announce = async (entry: Partial<FederatedCommunitiesInsert> = {}): Promise<number> => {
    const inserted = await drizzleDb()
      .insert(federatedCommunitiesTable)
      .values({
        publicKey: randomBytes(32),
        apiVersion: '1_0',
        endPoint: 'http://foreign.example/api/',
        lastAnnouncedAt: new Date(),
        ...entry,
      })
      .$returningId()
    return inserted[0].id
  }
  const entriesOf = (ids: number[]) =>
    drizzleDb()
      .select()
      .from(federatedCommunitiesTable)
      .where(inArray(federatedCommunitiesTable.id, ids))

  describe('dbFindFederatedCommunitiesNotVerified', () => {
    it('finds the foreign entries not verified yet or not since their last announcement', async () => {
      const notVerified = await announce()
      const reannounced = await announce({
        verifiedAt: new Date(Date.now() - 60_000),
        lastAnnouncedAt: new Date(),
      })
      await announce({ verifiedAt: new Date(), lastAnnouncedAt: new Date(Date.now() - 60_000) })
      await announce({ foreign: false })
      await announce({ apiVersion: '2_0' })

      const found = await dbFindFederatedCommunitiesNotVerified(100, 0)

      expect(found.map((entry) => entry.id)).toEqual([notVerified, reannounced])
    })

    it('hands out the entry parsed: the key as Buffer, an entry never updated is fine', async () => {
      const publicKey = randomBytes(32)
      const id = await announce({ publicKey })

      const [found] = await dbFindFederatedCommunitiesNotVerified(100, 0)

      expect(found).toMatchObject({
        id,
        publicKey,
        apiVersion: '1_0',
        endPoint: 'http://foreign.example/api/',
        verifiedAt: null,
        updatedAt: null,
      })
    })

    it('pages by id: at most limit entries, only those after the last id', async () => {
      const ids = [await announce(), await announce(), await announce()]

      const firstPage = await dbFindFederatedCommunitiesNotVerified(2, 0)
      expect(firstPage.map((entry) => entry.id)).toEqual([ids[0], ids[1]])

      const secondPage = await dbFindFederatedCommunitiesNotVerified(2, ids[1])
      expect(secondPage.map((entry) => entry.id)).toEqual([ids[2]])

      expect(await dbFindFederatedCommunitiesNotVerified(2, ids[2])).toEqual([])
    })
  })

  describe('dbUpdateFederatedCommunitiesVerified', () => {
    it('marks exactly the given entries as verified', async () => {
      const first = await announce()
      const second = await announce()
      const untouched = await announce()
      const now = new Date('2026-01-02T03:04:05.678Z')

      expect(await dbUpdateFederatedCommunitiesVerified([first, second], now)).toBe(2)

      const entries = await entriesOf([first, second, untouched])
      expect(entries.find((entry) => entry.id === first)).toMatchObject({
        verifiedAt: now,
        updatedAt: now,
      })
      expect(entries.find((entry) => entry.id === second)?.verifiedAt).toEqual(now)
      expect(entries.find((entry) => entry.id === untouched)?.verifiedAt).toBeNull()
    })

    it('touches nothing without ids', async () => {
      const id = await announce()
      expect(await dbUpdateFederatedCommunitiesVerified([], new Date())).toBe(0)
      expect((await entriesOf([id]))[0].verifiedAt).toBeNull()
    })
  })

  describe('dbClearFederatedCommunities', () => {
    it('removes the foreign entries and keeps the ones of the home community', async () => {
      const foreign = await announce()
      const home = await announce({ foreign: false })

      await dbClearFederatedCommunities()

      expect((await entriesOf([foreign, home])).map((entry) => entry.id)).toEqual([home])
    })
  })
})
