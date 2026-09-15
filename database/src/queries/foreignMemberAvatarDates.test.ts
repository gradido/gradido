// AI-GENERATED — not an architecture reference
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { foreignMemberAvatarDatesTable } from '../schemas'
import {
  dbSelectForeignMemberAvatarDates,
  dbUpsertForeignMemberAvatarDates,
  ForeignMemberRef,
  foreignMemberAvatarDateKey,
} from './foreignMemberAvatarDates'

const appDB = AppDatabase.getInstance()

// Pairs only: the table has no foreign key, so no `users` or `communities` rows are needed.
const PEER = '11111111-1111-4111-8111-111111111111'
const OTHER_PEER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTTO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

// ⛔ With milliseconds, on purpose. The wallet keeps a picture only while the date in the list
// equals the date the picture came with, to the millisecond; a column that dropped them would
// have it ask for the same picture on every visit and never show it from its store.
const PICTURE = new Date('2026-09-14T16:58:37.124Z')
const NEWER = new Date('2026-09-15T08:01:02.345Z')
const CHECKED = new Date('2026-09-15T09:00:00.001Z')
const LATER = new Date('2026-09-15T09:10:00.002Z')

const ref = (communityUuid: string, gradidoId: string): ForeignMemberRef => ({
  communityUuid,
  gradidoId,
})

/** The map as plain values; a date that did not come back as a Date throws here. */
const readable = (dates: Map<string, Date | null>) =>
  Object.fromEntries(
    [...dates].map(([key, date]) => [key, date === null ? null : date.toISOString()]),
  )

const storedRows = async () =>
  (
    await drizzleDb()
      .select()
      .from(foreignMemberAvatarDatesTable)
      .orderBy(foreignMemberAvatarDatesTable.communityUuid, foreignMemberAvatarDatesTable.gradidoId)
  ).map((row) => ({
    pair: foreignMemberAvatarDateKey(row),
    avatarUpdatedAt: row.avatarUpdatedAt === null ? null : row.avatarUpdatedAt.toISOString(),
    checkedAt: row.checkedAt.toISOString(),
  }))

beforeAll(async () => {
  await appDB.init()
})
beforeEach(async () => {
  await drizzleDb().delete(foreignMemberAvatarDatesTable)
})
afterAll(async () => {
  await drizzleDb().delete(foreignMemberAvatarDatesTable)
  await appDB.destroy()
})

describe('foreignMemberAvatarDates queries', () => {
  it('stores a date to the millisecond, and null for a member with nothing to show', async () => {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
      { communityUuid: PEER, gradidoId: OTTO, avatarUpdatedAt: null, checkedAt: CHECKED },
    ])

    const dates = await dbSelectForeignMemberAvatarDates([ref(PEER, ANNA), ref(PEER, OTTO)])

    expect(readable(dates)).toEqual({
      [foreignMemberAvatarDateKey(ref(PEER, ANNA))]: PICTURE.toISOString(),
      [foreignMemberAvatarDateKey(ref(PEER, OTTO))]: null,
    })
  })

  it('replaces what was stored, row by row in one statement: a new date, a withdrawal', async () => {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
      { communityUuid: PEER, gradidoId: OTTO, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
    ])

    // ⛔ Two rows that already exist, with DIFFERENT new values in one statement: a single
    // value written to every duplicate would give both the same date.
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: NEWER, checkedAt: LATER },
      { communityUuid: PEER, gradidoId: OTTO, avatarUpdatedAt: null, checkedAt: LATER },
    ])

    expect(await storedRows()).toEqual([
      {
        pair: foreignMemberAvatarDateKey(ref(PEER, ANNA)),
        avatarUpdatedAt: NEWER.toISOString(),
        checkedAt: LATER.toISOString(),
      },
      {
        pair: foreignMemberAvatarDateKey(ref(PEER, OTTO)),
        avatarUpdatedAt: null,
        checkedAt: LATER.toISOString(),
      },
    ])
  })

  it('brings a date back after a withdrawal, and leaves the rows it was not given alone', async () => {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: null, checkedAt: CHECKED },
      { communityUuid: PEER, gradidoId: OTTO, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
    ])

    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: NEWER, checkedAt: LATER },
    ])

    expect(await storedRows()).toEqual([
      {
        pair: foreignMemberAvatarDateKey(ref(PEER, ANNA)),
        avatarUpdatedAt: NEWER.toISOString(),
        checkedAt: LATER.toISOString(),
      },
      {
        pair: foreignMemberAvatarDateKey(ref(PEER, OTTO)),
        avatarUpdatedAt: PICTURE.toISOString(),
        checkedAt: CHECKED.toISOString(),
      },
    ])
  })

  it('leaves out a pair that was never stored', async () => {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
    ])

    const dates = await dbSelectForeignMemberAvatarDates([ref(PEER, ANNA), ref(PEER, OTTO)])

    expect(readable(dates)).toEqual({
      [foreignMemberAvatarDateKey(ref(PEER, ANNA))]: PICTURE.toISOString(),
    })
  })

  it('keeps members apart by the whole pair, not the gradido id alone', async () => {
    // The same gradido id in another community is another person.
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
      { communityUuid: OTHER_PEER, gradidoId: ANNA, avatarUpdatedAt: NEWER, checkedAt: CHECKED },
      { communityUuid: OTHER_PEER, gradidoId: OTTO, avatarUpdatedAt: NEWER, checkedAt: CHECKED },
    ])

    const dates = await dbSelectForeignMemberAvatarDates([ref(PEER, ANNA), ref(PEER, OTTO)])

    expect(readable(dates)).toEqual({
      [foreignMemberAvatarDateKey(ref(PEER, ANNA))]: PICTURE.toISOString(),
    })
  })

  it('answers members of several communities, each named many times, once each', async () => {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
      { communityUuid: OTHER_PEER, gradidoId: OTTO, avatarUpdatedAt: NEWER, checkedAt: CHECKED },
    ])

    // A booking list names its counterparty once per booking.
    const dates = await dbSelectForeignMemberAvatarDates([
      ref(PEER, ANNA),
      ref(OTHER_PEER, OTTO),
      ref(PEER, ANNA),
      ref(OTHER_PEER, OTTO),
      ref(PEER, ANNA),
    ])

    expect(readable(dates)).toEqual({
      [foreignMemberAvatarDateKey(ref(PEER, ANNA))]: PICTURE.toISOString(),
      [foreignMemberAvatarDateKey(ref(OTHER_PEER, OTTO))]: NEWER.toISOString(),
    })
  })

  it('answers nothing for no members, whatever the table holds', async () => {
    await dbUpsertForeignMemberAvatarDates([
      { communityUuid: PEER, gradidoId: ANNA, avatarUpdatedAt: PICTURE, checkedAt: CHECKED },
    ])
    // The fixture proves itself: with an empty table the check below could not fail.
    expect(await storedRows()).toHaveLength(1)

    expect(readable(await dbSelectForeignMemberAvatarDates([]))).toEqual({})
  })

  it('writes nothing for no rows, and does not fail', async () => {
    await dbUpsertForeignMemberAvatarDates([])
    expect(await storedRows()).toEqual([])
  })
})
