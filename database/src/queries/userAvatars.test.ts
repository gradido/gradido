// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userAvatarsTable } from '../schemas'
import { dbDeleteUserAvatar, dbFindUserAvatar, dbUpsertUserAvatar } from './userAvatars'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Not a real JPEG, just distinguishable bytes — these tests are about the round trip,
// not about the format. The format check lives at the API boundary.
const imageA = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02, 0x03])
const imageB = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x09, 0x08, 0x07, 0x06])

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(userAvatarsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('userAvatars query test', () => {
  it('reports a miss for a member without a picture', async () => {
    const result = await dbFindUserAvatar(1)
    expect(result.success).toBe(false)
  })

  it('stores a picture and reads the same bytes back', async () => {
    const stored = await dbUpsertUserAvatar({
      userId: 1,
      image: imageA,
      mimeType: 'image/jpeg',
    })
    expect(stored.success).toBe(true)

    const result = await dbFindUserAvatar(1)
    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }
    expect(Buffer.from(result.value.image).equals(imageA)).toBe(true)
    expect(result.value.mimeType).toBe('image/jpeg')
  })

  it('replaces the picture instead of adding a second row', async () => {
    const stored = await dbUpsertUserAvatar({
      userId: 1,
      image: imageB,
      mimeType: 'image/jpeg',
    })
    expect(stored.success).toBe(true)

    const rows = await db.select().from(userAvatarsTable).where(eq(userAvatarsTable.userId, 1))
    expect(rows).toHaveLength(1)
    expect(Buffer.from(rows[0].image).equals(imageB)).toBe(true)
  })

  // The case that a row counter would misreport: MySQL answers 0 affected rows when the
  // stored value already equals the new one. Saving the same picture twice is the most
  // ordinary thing a member can do, and it has to read as success.
  it('reports success when the very same picture is stored again', async () => {
    const again = await dbUpsertUserAvatar({
      userId: 1,
      image: imageB,
      mimeType: 'image/jpeg',
    })
    expect(again.success).toBe(true)
  })

  it('keeps members apart', async () => {
    await dbUpsertUserAvatar({ userId: 2, image: imageA, mimeType: 'image/jpeg' })

    const first = await dbFindUserAvatar(1)
    const second = await dbFindUserAvatar(2)
    expect(first.success && second.success).toBe(true)
    if (!first.success || !second.success) {
      return
    }
    expect(Buffer.from(first.value.image).equals(imageB)).toBe(true)
    expect(Buffer.from(second.value.image).equals(imageA)).toBe(true)
  })

  it('removes the picture and leaves the other member alone', async () => {
    const removed = await dbDeleteUserAvatar(1)
    expect(removed.success).toBe(true)

    expect((await dbFindUserAvatar(1)).success).toBe(false)
    expect((await dbFindUserAvatar(2)).success).toBe(true)
  })

  it('reports a miss when there was nothing to remove', async () => {
    const removed = await dbDeleteUserAvatar(1)
    expect(removed.success).toBe(false)
  })
})
