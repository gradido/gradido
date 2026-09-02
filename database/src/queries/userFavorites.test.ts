// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userFavoritesTable } from '../schemas'
import {
  dbDeleteFavorite,
  dbDeleteFavoritesByUserId,
  dbInsertFavorite,
  dbSelectFavoritesByUserId,
} from './userFavorites'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Two members of the same community and one from another; the pairs are all that
// matters here, no users rows are needed (the table carries no foreign key on purpose).
const COMMUNITY = '11111111-1111-1111-1111-111111111111'
const OTHER_COMMUNITY = '22222222-2222-2222-2222-222222222222'
const CARLA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const BOB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const SARAH = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(userFavoritesTable)
})
afterAll(async () => {
  await db.delete(userFavoritesTable)
  await appDB.destroy()
})

describe('userFavorites query test', () => {
  it('starts empty', async () => {
    expect(await dbSelectFavoritesByUserId(1)).toEqual([])
  })

  it('stores a heart and reads it back for its owner only', async () => {
    await dbInsertFavorite({
      userId: 1,
      favoriteCommunityUuid: COMMUNITY,
      favoriteGradidoId: CARLA,
    })
    const mine = await dbSelectFavoritesByUserId(1)
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({
      userId: 1,
      favoriteCommunityUuid: COMMUNITY,
      favoriteGradidoId: CARLA,
    })
    expect(mine[0].createdAt).toBeInstanceOf(Date)
    // Somebody else asking sees nothing of it.
    expect(await dbSelectFavoritesByUserId(2)).toEqual([])
  })

  it('treats a second heart for the same person as the same heart', async () => {
    const before = await dbSelectFavoritesByUserId(1)
    // Must not throw, must not add a row, must keep the first created_at.
    await dbInsertFavorite({
      userId: 1,
      favoriteCommunityUuid: COMMUNITY,
      favoriteGradidoId: CARLA,
    })
    const after = await dbSelectFavoritesByUserId(1)
    expect(after).toHaveLength(1)
    expect(after[0].createdAt.getTime()).toBe(before[0].createdAt.getTime())
  })

  it('keeps hearts apart by the whole pair, not the gradido id alone', async () => {
    // The same gradido id in another community is another person.
    await dbInsertFavorite({
      userId: 1,
      favoriteCommunityUuid: OTHER_COMMUNITY,
      favoriteGradidoId: CARLA,
    })
    await dbInsertFavorite({ userId: 1, favoriteCommunityUuid: COMMUNITY, favoriteGradidoId: BOB })
    const mine = await dbSelectFavoritesByUserId(1)
    // Compared as a set: the query orders by created_at, and two inserts a few
    // milliseconds apart are not a fixture this test can rely on.
    expect(mine.map((f) => `${f.favoriteCommunityUuid}/${f.favoriteGradidoId}`).sort()).toEqual(
      [`${COMMUNITY}/${CARLA}`, `${OTHER_COMMUNITY}/${CARLA}`, `${COMMUNITY}/${BOB}`].sort(),
    )
    // The first heart given is still the first in the list.
    expect(mine[0]).toMatchObject({ favoriteCommunityUuid: COMMUNITY, favoriteGradidoId: CARLA })
  })

  it('takes one heart away and reports the one that is not there', async () => {
    const gone = await dbDeleteFavorite(1, { communityUuid: OTHER_COMMUNITY, gradidoId: CARLA })
    expect(gone.success).toBe(true)
    const again = await dbDeleteFavorite(1, { communityUuid: OTHER_COMMUNITY, gradidoId: CARLA })
    expect(again.success).toBe(false)
    if (!again.success) {
      expect(again.error.name).toBe('DBNotFoundError')
    }
    // The others are untouched.
    expect(await dbSelectFavoritesByUserId(1)).toHaveLength(2)
  })

  it("does not let one member remove another member's heart", async () => {
    await dbInsertFavorite({
      userId: 2,
      favoriteCommunityUuid: COMMUNITY,
      favoriteGradidoId: SARAH,
    })
    const attempt = await dbDeleteFavorite(1, { communityUuid: COMMUNITY, gradidoId: SARAH })
    expect(attempt.success).toBe(false)
    expect(await dbSelectFavoritesByUserId(2)).toHaveLength(1)
  })

  it('removes every heart of a member at once, and counts them', async () => {
    expect(await dbDeleteFavoritesByUserId(1)).toBe(2)
    expect(await dbDeleteFavoritesByUserId(1)).toBe(0)
    expect(await dbSelectFavoritesByUserId(1)).toEqual([])
    // Another member's row survives.
    expect(await dbSelectFavoritesByUserId(2)).toHaveLength(1)
  })
})
