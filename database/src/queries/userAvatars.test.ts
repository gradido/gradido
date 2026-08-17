// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userAvatarsTable } from '../schemas'
import {
  dbDeleteUserAvatar,
  dbFindUserAvatarFull,
  dbFindUserAvatarSmall,
  dbUpsertUserAvatar,
} from './userAvatars'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Not real JPEGs, just distinguishable bytes — these tests are about the round trip, not
// about the format. The format check lives at the API boundary. Small and full differ on
// purpose: a query that returned the wrong column would otherwise pass.
const smallA = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02, 0x03])
const fullA = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x11, 0x12, 0x13, 0x14, 0x15])
const smallB = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x09, 0x08])
const fullB = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x19, 0x18, 0x17, 0x16])

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
    expect((await dbFindUserAvatarSmall(1)).success).toBe(false)
    expect((await dbFindUserAvatarFull(1)).success).toBe(false)
  })

  it('stores both renditions and reads each back from its own column', async () => {
    const stored = await dbUpsertUserAvatar({
      userId: 1,
      avatarSmall: smallA,
      avatarFull: fullA,
      mimeType: 'image/jpeg',
    })
    expect(stored.success).toBe(true)

    const small = await dbFindUserAvatarSmall(1)
    const full = await dbFindUserAvatarFull(1)
    expect(small.success && full.success).toBe(true)
    if (!small.success || !full.success) {
      return
    }
    expect(Buffer.from(small.value).equals(smallA)).toBe(true)
    expect(Buffer.from(full.value).equals(fullA)).toBe(true)
  })

  // The two readers select one column each. Reading the wrong one is a mistake no type
  // catches — both are Buffers — so it is asserted rather than assumed.
  it('does not hand the full rendition out as the small one', async () => {
    const small = await dbFindUserAvatarSmall(1)
    expect(small.success).toBe(true)
    if (!small.success) {
      return
    }
    expect(Buffer.from(small.value).equals(fullA)).toBe(false)
  })

  it('replaces both renditions instead of adding a second row', async () => {
    const stored = await dbUpsertUserAvatar({
      userId: 1,
      avatarSmall: smallB,
      avatarFull: fullB,
      mimeType: 'image/jpeg',
    })
    expect(stored.success).toBe(true)

    const rows = await db.select().from(userAvatarsTable).where(eq(userAvatarsTable.userId, 1))
    expect(rows).toHaveLength(1)
    expect(Buffer.from(rows[0].avatarSmall).equals(smallB)).toBe(true)
    expect(Buffer.from(rows[0].avatarFull).equals(fullB)).toBe(true)
  })

  // The case that a row counter would misreport: MySQL answers 0 affected rows when the
  // stored value already equals the new one. Saving the same picture twice is the most
  // ordinary thing a member can do, and it has to read as success.
  it('reports success when the very same picture is stored again', async () => {
    const again = await dbUpsertUserAvatar({
      userId: 1,
      avatarSmall: smallB,
      avatarFull: fullB,
      mimeType: 'image/jpeg',
    })
    expect(again.success).toBe(true)
  })

  it('keeps members apart', async () => {
    await dbUpsertUserAvatar({
      userId: 2,
      avatarSmall: smallA,
      avatarFull: fullA,
      mimeType: 'image/jpeg',
    })

    const first = await dbFindUserAvatarSmall(1)
    const second = await dbFindUserAvatarSmall(2)
    expect(first.success && second.success).toBe(true)
    if (!first.success || !second.success) {
      return
    }
    expect(Buffer.from(first.value).equals(smallB)).toBe(true)
    expect(Buffer.from(second.value).equals(smallA)).toBe(true)
  })

  it('removes both renditions and leaves the other member alone', async () => {
    const removed = await dbDeleteUserAvatar(1)
    expect(removed.success).toBe(true)

    expect((await dbFindUserAvatarSmall(1)).success).toBe(false)
    expect((await dbFindUserAvatarFull(1)).success).toBe(false)
    expect((await dbFindUserAvatarSmall(2)).success).toBe(true)
  })

  it('reports a miss when there was nothing to remove', async () => {
    const removed = await dbDeleteUserAvatar(1)
    expect(removed.success).toBe(false)
  })
})
