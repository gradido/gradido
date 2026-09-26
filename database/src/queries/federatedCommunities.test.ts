// AI-GENERATED — not an architecture reference
import { AppDatabase } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import { dbFindFederatedCommunityByPublicKeyAndApi } from './federatedCommunities'
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
})
