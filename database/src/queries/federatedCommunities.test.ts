// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { type HomeCommunityInfo, hieroIdSchema } from 'shared'
import * as v from 'valibot'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { communitiesTable, federatedCommunitiesTable } from '../schemas'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import {
  dbFindFederatedCommunityByPublicKeyAndApi,
  dbUpsertVerifiedFederatedCommunity,
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

  describe('dbUpsertVerifiedFederatedCommunity', () => {
    const END_POINT = 'http://foreign.example/api/'

    const infoOf = (publicKey: Buffer): HomeCommunityInfo => ({
      name: 'Answered-name',
      description: 'Answered-description',
      creationDate: new Date('2024-05-06T07:08:09.123Z'),
      publicKey,
      publicJwtKey: 'answered-public-jwt-key',
      hieroTopicId: v.parse(hieroIdSchema, '0.0.2'),
    })

    // an announced entry as the dht-node leaves it: foreign, not verified, no community row yet
    const announce = async (publicKey: Buffer, apiVersion = '1_0'): Promise<number> => {
      const inserted = await drizzleDb()
        .insert(federatedCommunitiesTable)
        .values({ publicKey, apiVersion, endPoint: END_POINT, lastAnnouncedAt: new Date() })
        .$returningId()
      return inserted[0].id
    }
    const entryOf = async (id: number) =>
      (
        await drizzleDb()
          .select()
          .from(federatedCommunitiesTable)
          .where(eq(federatedCommunitiesTable.id, id))
      )[0]
    const communitiesOf = (publicKey: Buffer) =>
      drizzleDb().select().from(communitiesTable).where(eq(communitiesTable.publicKey, publicKey))

    it('marks the entry as verified and inserts the community it answered for', async () => {
      const publicKey = randomBytes(32)
      const id = await announce(publicKey)
      const before = Date.now()

      const result = await dbUpsertVerifiedFederatedCommunity(
        { id, endPoint: END_POINT },
        infoOf(publicKey),
      )
      expect(result.success).toBe(true)

      const entry = await entryOf(id)
      expect(entry.verifiedAt?.getTime()).toBeGreaterThanOrEqual(before)
      expect(entry.updatedAt).toStrictEqual(entry.verifiedAt)

      const communities = await communitiesOf(publicKey)
      expect(communities).toHaveLength(1)
      expect(communities[0]).toMatchObject({
        foreign: true,
        url: END_POINT,
        name: 'Answered-name',
        description: 'Answered-description',
        creationDate: new Date('2024-05-06T07:08:09.123Z'),
        publicJwtKey: 'answered-public-jwt-key',
        hieroTopicId: '0.0.2',
      })
    })

    it('updates the community row that is already there instead of adding a second', async () => {
      const community = await createCommunity(true)
      const id = await announce(community.publicKey)

      const result = await dbUpsertVerifiedFederatedCommunity(
        { id, endPoint: END_POINT },
        infoOf(community.publicKey),
      )
      expect(result.success).toBe(true)

      const communities = await communitiesOf(community.publicKey)
      expect(communities).toHaveLength(1)
      expect(communities[0]).toMatchObject({
        id: community.id,
        url: END_POINT,
        name: 'Answered-name',
        description: 'Answered-description',
        // what the answer does not carry stays as it was
        communityUuid: community.communityUuid,
        authenticatedAt: community.authenticatedAt,
      })
      expect(communities[0].updatedAt).not.toBeNull()
    })

    // The entry is verified on every round, the community row only written when the answer differs.
    it('leaves a community row alone that already says what the answer says', async () => {
      const publicKey = randomBytes(32)
      const id = await announce(publicKey)
      await dbUpsertVerifiedFederatedCommunity({ id, endPoint: END_POINT }, infoOf(publicKey))
      const first = (await communitiesOf(publicKey))[0]

      const result = await dbUpsertVerifiedFederatedCommunity(
        { id, endPoint: END_POINT },
        infoOf(publicKey),
      )
      expect(result.success).toBe(true)
      expect((await communitiesOf(publicKey))[0]).toStrictEqual(first)
    })

    it('writes nothing when the answer carries another public key than the entry', async () => {
      const id = await announce(randomBytes(32))
      const answeredKey = randomBytes(32)

      const result = await dbUpsertVerifiedFederatedCommunity(
        { id, endPoint: END_POINT },
        infoOf(answeredKey),
      )
      if (result.success) {
        throw new Error('expected not found')
      }
      expect(result.error).toBeInstanceOf(DBNotFoundError)
      expect(result.error.table).toBe('federated_communities')
      expect((await entryOf(id)).verifiedAt).toBeNull()
      expect(await communitiesOf(answeredKey)).toHaveLength(0)
    })

    it('does not verify the entry of the home community', async () => {
      const home = await createCommunity(false)
      const inserted = await drizzleDb()
        .insert(federatedCommunitiesTable)
        .values({
          foreign: false,
          publicKey: home.publicKey,
          apiVersion: '1_0',
          endPoint: END_POINT,
        })
        .$returningId()

      const result = await dbUpsertVerifiedFederatedCommunity(
        { id: inserted[0].id, endPoint: END_POINT },
        infoOf(home.publicKey),
      )
      expect(result.success).toBe(false)
      expect((await entryOf(inserted[0].id)).verifiedAt).toBeNull()
    })
  })
})
