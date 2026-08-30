// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userAvatarsTable, usersTable } from '../schemas'
import {
  dbDeleteUserAvatar,
  dbFindMemberAvatarFull,
  dbFindMemberAvatarsSmall,
  dbFindMemberAvatarTimestamps,
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

// The two batched readers are the ones other members' faces travel through, so what they
// REFUSE matters more than what they return. Every refusal below is paired with the case
// that differs from it in exactly one column -- a test that only ever asserts "nothing
// came back" stays green when the condition dies and the pictures start flowing.
//
// Ids far away from the ones above on purpose: this block writes users rows, which the
// rest of the file does not, and it takes them out again afterwards.
describe('member avatars for the booking list', () => {
  const SHOWN = 9001
  const SWITCHED_OFF = 9002
  const DELETED = 9003
  const NO_PICTURE = 9004
  const FOREIGN = 9005
  // A local member who DOES carry a community uuid. Every other fixture here leaves the
  // column null, which is a real state -- members who registered before the home community
  // had one -- but it means the uuid the answer carries back is never anything but null,
  // and a column that is only ever asserted as null is not asserted at all.
  const WITH_COMMUNITY = 9006
  const HOME_COMMUNITY = '11111111-1111-4111-8111-111111111111'
  const gid = (id: number) => `00000000-0000-4000-8000-0000000${id}`

  const picture = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x42])
  // ⚠️ Distinct from `picture` on purpose. Both columns held the same bytes here until the
  // full rendition got a member-facing reader of its own -- at which point "hands back the
  // full one" and "hands back the small one" became assertions this fixture could not tell
  // apart, and both would have passed.
  const pictureFull = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x43, 0x44, 0x45, 0x46])
  const ALL = [SHOWN, SWITCHED_OFF, DELETED, NO_PICTURE, FOREIGN, WITH_COMMUNITY]

  beforeAll(async () => {
    await db.delete(usersTable).where(inArray(usersTable.id, ALL))
    await db.insert(usersTable).values([
      { id: SHOWN, gradidoId: gid(SHOWN), avatarVisibleToMembers: 1 },
      { id: SWITCHED_OFF, gradidoId: gid(SWITCHED_OFF), avatarVisibleToMembers: 0 },
      { id: DELETED, gradidoId: gid(DELETED), avatarVisibleToMembers: 1, deletedAt: new Date() },
      { id: NO_PICTURE, gradidoId: gid(NO_PICTURE), avatarVisibleToMembers: 1 },
      // A member of ANOTHER community, exactly as the federation stores them: same table,
      // same shape, allowed and undeleted. Production cannot give such a row a picture
      // today -- only setUserAvatar writes one, and only for its own caller -- so this
      // builds the state the code must REFUSE rather than the state it happens to avoid.
      {
        id: FOREIGN,
        gradidoId: gid(FOREIGN),
        avatarVisibleToMembers: 1,
        foreign: 1,
        communityUuid: '99999999-9999-4999-8999-999999999999',
      },
      {
        id: WITH_COMMUNITY,
        gradidoId: gid(WITH_COMMUNITY),
        avatarVisibleToMembers: 1,
        communityUuid: HOME_COMMUNITY,
      },
    ])
    for (const userId of [SHOWN, SWITCHED_OFF, DELETED, FOREIGN, WITH_COMMUNITY]) {
      await dbUpsertUserAvatar({
        userId,
        avatarSmall: picture,
        avatarFull: pictureFull,
        mimeType: 'image/jpeg',
      })
    }
  })

  afterAll(async () => {
    await db.delete(userAvatarsTable).where(inArray(userAvatarsTable.userId, ALL))
    await db.delete(usersTable).where(inArray(usersTable.id, ALL))
  })

  it('hands out the picture of a member who allows it', async () => {
    const rows = await dbFindMemberAvatarsSmall([gid(SHOWN)])
    expect(rows).toHaveLength(1)
    expect(rows[0].gradidoId).toBe(gid(SHOWN))
    expect(Buffer.from(rows[0].avatarSmall).equals(picture)).toBe(true)
  })

  /**
   * ⛔ The half of the answer nothing measured. The wallet keys its store on the PAIR --
   * `${communityUuid}/${gradidoID}` -- and it reads the uuid off the answer, not off the
   * request. Drop this column from the projection and every test here still passes, while
   * in the wallet every picture is stored under a key nothing ever looks up: no face ever
   * appears, and the same members are re-requested on every single booking list, forever,
   * with no error anywhere.
   *
   * The query's own docblock rests on this ("The pair comes back with each row instead, so
   * the caller can match what it asked for"), so it is worth one fixture that has a uuid.
   */
  it('carries the community back with the picture, which is half the identity', async () => {
    const rows = await dbFindMemberAvatarsSmall([gid(WITH_COMMUNITY)])
    expect(rows).toHaveLength(1)
    expect(rows[0].gradidoId).toBe(gid(WITH_COMMUNITY))
    expect(rows[0].communityUuid).toBe(HOME_COMMUNITY)
  })

  // ...and null is a real answer too, not an absent one: a member who registered before
  // the home community had a uuid has none stored, and matching on the pair in SQL would
  // drop exactly those.
  it('carries a null community back rather than dropping the member', async () => {
    const rows = await dbFindMemberAvatarsSmall([gid(SHOWN)])
    expect(rows).toHaveLength(1)
    expect(rows[0].communityUuid).toBeNull()
  })

  // AS-003. The row and the picture both exist; only the switch differs from the case
  // above, so this cannot pass for some unrelated reason.
  it('hands out nothing for a member who switched it off', async () => {
    const rows = await dbFindMemberAvatarsSmall([gid(SWITCHED_OFF)])
    expect(rows).toEqual([])
  })

  // AS-009. Somebody who closed their account can no longer reach the switch, so a
  // disclosure they cannot withdraw must not keep running. Their name still travels with
  // old bookings; their face does not.
  it('hands out nothing for a deleted member, switch or no switch', async () => {
    const rows = await dbFindMemberAvatarsSmall([gid(DELETED)])
    expect(rows).toEqual([])
  })

  // A gradidoId identifies one person only together with a community (see the uuid_key
  // index), so a lookup by id alone reaches members of other communities -- who never
  // agreed to anything here, and whose pictures are a separate delivery.
  it('hands out nothing for a member of another community', async () => {
    expect(await dbFindMemberAvatarsSmall([gid(FOREIGN)])).toEqual([])
    expect(await dbFindMemberAvatarTimestamps([FOREIGN])).toEqual(new Map())
  })

  it('hands out nothing for a member who has no picture', async () => {
    const rows = await dbFindMemberAvatarsSmall([gid(NO_PICTURE)])
    expect(rows).toEqual([])
  })

  // The whole point of the batch: one question, many members, and the refusals do not
  // take the permitted ones down with them.
  it('answers for a mixed list without letting the refusals swallow the rest', async () => {
    const rows = await dbFindMemberAvatarsSmall([
      gid(SHOWN),
      gid(SWITCHED_OFF),
      gid(DELETED),
      gid(NO_PICTURE),
      gid(FOREIGN),
      '00000000-0000-4000-8000-00000009999',
    ])
    expect(rows.map((row) => row.gradidoId)).toEqual([gid(SHOWN)])
  })

  // An unknown member is an empty answer, never an error -- otherwise the query would
  // tell whoever asks which accounts exist.
  it('says nothing about a member it does not know', async () => {
    const rows = await dbFindMemberAvatarsSmall(['00000000-0000-4000-8000-00000009999'])
    expect(rows).toEqual([])
  })

  it('asks nothing at all for an empty list', async () => {
    expect(await dbFindMemberAvatarsSmall([])).toEqual([])
    expect(await dbFindMemberAvatarTimestamps([])).toEqual(new Map())
  })

  // The timestamps carry the same disclosure rule as the pictures. They are what the
  // wallet decides freshness by, so a member missing here is a member whose stored
  // picture must go -- getting this filter wrong would keep a withdrawn face on screen.
  it('dates only the pictures that may be shown', async () => {
    const dates = await dbFindMemberAvatarTimestamps([SHOWN, SWITCHED_OFF, DELETED, NO_PICTURE])
    expect([...dates.keys()]).toEqual([SHOWN])
    expect(dates.get(SHOWN)).toBeInstanceOf(Date)
  })

  // AS-018: the 512 crop, for ONE member, on a click. Every refusal the small rendition
  // makes has to be made here too -- this reader hands out a bigger picture of the same
  // face, so a gap here is the same leak, only more of it.
  describe('the full rendition of another member', () => {
    it('hands out the full crop of a member who allows it', async () => {
      const full = await dbFindMemberAvatarFull(gid(SHOWN))
      expect(full).not.toBeNull()
      expect(Buffer.from(full as Buffer).equals(pictureFull)).toBe(true)
    })

    // Two columns, both Buffers, and nothing in the types keeps them apart. Asserted
    // rather than assumed, exactly as it is for the owner's own two readers above.
    it('does not hand the small rendition out as the full one', async () => {
      const full = await dbFindMemberAvatarFull(gid(SHOWN))
      expect(Buffer.from(full as Buffer).equals(picture)).toBe(false)
    })

    // AS-003, AS-009 and the community scope, one per case, each differing from the
    // permitted one in exactly one column. A single "returns null" test would stay green
    // if the whole guard died.
    it('hands out nothing for a member who switched it off', async () => {
      expect(await dbFindMemberAvatarFull(gid(SWITCHED_OFF))).toBeNull()
    })

    it('hands out nothing for a deleted member, switch or no switch', async () => {
      expect(await dbFindMemberAvatarFull(gid(DELETED))).toBeNull()
    })

    it('hands out nothing for a member of another community', async () => {
      expect(await dbFindMemberAvatarFull(gid(FOREIGN))).toBeNull()
    })

    it('hands out nothing for a member who has no picture', async () => {
      expect(await dbFindMemberAvatarFull(gid(NO_PICTURE))).toBeNull()
    })

    // One answer for "no such member" and for "not allowed", so that asking cannot be
    // used to find out which accounts exist.
    it('says nothing about a member it does not know', async () => {
      expect(await dbFindMemberAvatarFull('00000000-0000-4000-8000-00000009999')).toBeNull()
    })
  })
})
