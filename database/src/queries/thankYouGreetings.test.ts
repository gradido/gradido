// AI-GENERATED — not an architecture reference
import { inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { EventType } from '../enum/EventType'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'
import {
  eventsTable,
  thankYouGreetingPicturesTable,
  thankYouGreetingsTable,
  transactionLinksTable,
} from '../schemas'
import {
  dbCountAcceptedThankYouGreetings,
  dbCountAcceptedThankYouGreetingsByWeek,
  dbCountExpiredThankYouGreetings,
  dbCountExpiredThankYouGreetingsByWeek,
  dbCountThankYouGreetings,
  dbCountThankYouGreetingsByWeek,
  dbDeleteThankYouGreetingByLinkCode,
  dbInsertThankYouGreeting,
  dbSelectThankYouGreetingsByLinkCodes,
  dbSelectThankYouGreetingsByLinkIds,
} from './thankYouGreetings'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Codes as createTransactionLink makes them: 24 hex characters, with letters in them. No
// transaction_links rows are needed -- the table carries no foreign key on purpose.
const SARAH_CODE = 'a3f9c2d41b7e19981fa0c4e2'
const PLAIN_CODE = 'b7d0e5a2996c19981fa0c4e3'
const NAMELESS_CODE = 'c1e8f6b3447d19981fa0c4e4'
const UNKNOWN_CODE = 'd2f9a7c4558e19981fa0c4e5'

// Distinct in every field, so that a value read back can only have come from its own column.
const SARAH = {
  transactionLinkCode: SARAH_CODE,
  motif: 'morning-light',
  line: 'Einfach so — weil es Dich gibt.',
  recipientName: 'Sarah',
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(thankYouGreetingsTable)
})
afterAll(async () => {
  await db.delete(thankYouGreetingsTable)
  await appDB.destroy()
})

describe('thankYouGreetings query test', () => {
  it('starts empty', async () => {
    expect(await dbSelectThankYouGreetingsByLinkCodes([SARAH_CODE])).toEqual([])
  })

  it('asks nothing for no codes', async () => {
    expect(await dbSelectThankYouGreetingsByLinkCodes([])).toEqual([])
  })

  it('files a greeting and reads every column back from its own place', async () => {
    expect(await dbInsertThankYouGreeting(SARAH)).toEqual({ success: true })

    const rows = await dbSelectThankYouGreetingsByLinkCodes([SARAH_CODE])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject(SARAH)
    expect(rows[0].id).toBeGreaterThan(0)
    expect(rows[0].createdAt).toBeInstanceOf(Date)
  })

  it('files a greeting with a motif alone', async () => {
    expect(
      await dbInsertThankYouGreeting({ transactionLinkCode: NAMELESS_CODE, motif: 'bouquet' }),
    ).toEqual({ success: true })

    const rows = await dbSelectThankYouGreetingsByLinkCodes([NAMELESS_CODE])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      transactionLinkCode: NAMELESS_CODE,
      motif: 'bouquet',
      line: null,
      recipientName: null,
    })
  })

  it('refuses a second greeting for the same link and leaves the first as it is', async () => {
    const result = await dbInsertThankYouGreeting({
      transactionLinkCode: SARAH_CODE,
      motif: 'bouquet',
      line: 'Danke für Deine Hilfe!',
      recipientName: 'Claude',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeInstanceOf(DBDuplicateEntryError)
      // What the error says goes into a log: the code, never the name.
      expect(result.error.message).toContain(SARAH_CODE)
      expect(result.error.message).not.toContain('Claude')
    }
    const rows = await dbSelectThankYouGreetingsByLinkCodes([SARAH_CODE])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject(SARAH)
  })

  it('reads the greetings of a whole page of links at once, and only theirs', async () => {
    const rows = await dbSelectThankYouGreetingsByLinkCodes([
      SARAH_CODE,
      PLAIN_CODE,
      NAMELESS_CODE,
      UNKNOWN_CODE,
    ])

    // The plain link and the unknown code have no row; that is the whole of their answer.
    expect(rows.map((row) => row.transactionLinkCode).sort()).toEqual(
      [SARAH_CODE, NAMELESS_CODE].sort(),
    )
    // One of the two alone brings one row: the list is what decides, not the table.
    expect(await dbSelectThankYouGreetingsByLinkCodes([NAMELESS_CODE, PLAIN_CODE])).toHaveLength(1)
  })

  it('takes the greeting of one link out and leaves the others', async () => {
    expect(await dbDeleteThankYouGreetingByLinkCode(SARAH_CODE)).toEqual({ success: true })

    expect(await dbSelectThankYouGreetingsByLinkCodes([SARAH_CODE])).toEqual([])
    expect(await dbSelectThankYouGreetingsByLinkCodes([NAMELESS_CODE])).toHaveLength(1)
  })

  it('says not found for a link that has no greeting', async () => {
    const again = await dbDeleteThankYouGreetingByLinkCode(SARAH_CODE)
    expect(again.success).toBe(false)
    if (!again.success) {
      expect(again.error).toBeInstanceOf(DBNotFoundError)
    }

    const plain = await dbDeleteThankYouGreetingByLinkCode(PLAIN_CODE)
    expect(plain.success).toBe(false)
    // Nothing else went with it.
    expect(await dbSelectThankYouGreetingsByLinkCodes([NAMELESS_CODE])).toHaveLength(1)
  })

  it('takes the code again once its greeting is gone', async () => {
    expect(await dbInsertThankYouGreeting(SARAH)).toEqual({ success: true })
    expect(await dbSelectThankYouGreetingsByLinkCodes([SARAH_CODE])).toHaveLength(1)
  })
})

/**
 * The booking list's way to a greeting: a booking carries the id of its link, the greeting
 * hangs on the link's code (dbSelectThankYouGreetingsByLinkIds).
 *
 * The links here are rows of `transaction_links` with ids far from any other test's, and far
 * from the ids of the greetings' own rows: an answer keyed by the wrong one of the two would
 * not find them.
 */
describe('dbSelectThankYouGreetingsByLinkIds', () => {
  const EMMA_LINK = { id: 880001, code: 'e4a0b8d5669f19981fa0c4e6' }
  const PLAIN_LINK = { id: 880002, code: 'f5b1c9e6770a19981fa0c4e7' }
  const BOUQUET_LINK = { id: 880003, code: 'a6c2d0f7881b19981fa0c4e8' }
  const NO_SUCH_LINK = 880099
  // A greeting whose link was never saved (createTransactionLink files the greeting first).
  const ORPHAN_CODE = 'b7d3e1a8992c19981fa0c4e9'
  const LINKS = [EMMA_LINK, PLAIN_LINK, BOUQUET_LINK]
  // Who made which link: the answer names them, and the booking list shows a greeting only
  // where that member is the booking's sender.
  const MAKER = { [EMMA_LINK.id]: 880011, [PLAIN_LINK.id]: 880012, [BOUQUET_LINK.id]: 880013 }
  const CODES = [EMMA_LINK.code, BOUQUET_LINK.code, ORPHAN_CODE]

  const EMMA = {
    transactionLinkCode: EMMA_LINK.code,
    motif: 'giving-hands',
    line: 'Danke für Deine Hilfe!',
    recipientName: 'Emma',
  }
  const BOUQUET = { transactionLinkCode: BOUQUET_LINK.code, motif: 'bouquet' }
  const ORPHAN = { transactionLinkCode: ORPHAN_CODE, motif: 'glowing-swirl', line: 'Ohne Link' }

  const removeFixture = async () => {
    await db.delete(transactionLinksTable).where(
      inArray(
        transactionLinksTable.id,
        LINKS.map((link) => link.id),
      ),
    )
    await db
      .delete(thankYouGreetingsTable)
      .where(inArray(thankYouGreetingsTable.transactionLinkCode, CODES))
  }

  beforeAll(async () => {
    await removeFixture()
    await db.insert(transactionLinksTable).values(
      LINKS.map((link) => ({
        ...link,
        userId: MAKER[link.id],
        memo: 'Danke für Deine Hilfe!',
        createdAt: new Date('2026-10-02T17:42:00Z'),
        validUntil: new Date('2026-10-16T17:42:00Z'),
      })),
    )
    for (const greeting of [EMMA, BOUQUET, ORPHAN]) {
      expect(await dbInsertThankYouGreeting(greeting)).toEqual({ success: true })
    }
  })
  afterAll(removeFixture)

  it('asks nothing for no ids', async () => {
    expect(await dbSelectThankYouGreetingsByLinkIds([])).toEqual(new Map())
  })

  it('answers with the greeting of a link under the id of that link', async () => {
    const greetings = await dbSelectThankYouGreetingsByLinkIds([EMMA_LINK.id])

    expect([...greetings.keys()]).toEqual([EMMA_LINK.id])
    const emma = greetings.get(EMMA_LINK.id)?.greeting
    expect(emma).toMatchObject(EMMA)
    // The whole row of the greeting, as the link lists read it: its own id among it, which
    // is not the link's.
    expect(emma?.id).toBeGreaterThan(0)
    expect(emma?.id).not.toBe(EMMA_LINK.id)
    expect(emma?.createdAt).toBeInstanceOf(Date)
  })

  // The id on a booking does not prove whose greeting it is; the maker of the link does.
  it('names the member who made each link beside its greeting', async () => {
    const greetings = await dbSelectThankYouGreetingsByLinkIds([EMMA_LINK.id, BOUQUET_LINK.id])

    expect(greetings.get(EMMA_LINK.id)?.linkUserId).toBe(MAKER[EMMA_LINK.id])
    expect(greetings.get(BOUQUET_LINK.id)?.linkUserId).toBe(MAKER[BOUQUET_LINK.id])
    expect(Object.keys(greetings.get(EMMA_LINK.id) ?? {}).sort()).toEqual([
      'greeting',
      'linkUserId',
    ])
  })

  it('leaves a plain link and an unknown id out of the answer', async () => {
    expect(await dbSelectThankYouGreetingsByLinkIds([PLAIN_LINK.id, NO_SUCH_LINK])).toEqual(
      new Map(),
    )
  })

  it('reads the greetings of a whole page at once, each under its own link', async () => {
    const greetings = await dbSelectThankYouGreetingsByLinkIds([
      BOUQUET_LINK.id,
      PLAIN_LINK.id,
      NO_SUCH_LINK,
      EMMA_LINK.id,
    ])

    expect([...greetings.keys()].sort((a, b) => a - b)).toEqual([EMMA_LINK.id, BOUQUET_LINK.id])
    expect(greetings.get(EMMA_LINK.id)?.greeting).toMatchObject(EMMA)
    expect(greetings.get(BOUQUET_LINK.id)?.greeting).toMatchObject({
      ...BOUQUET,
      line: null,
      recipientName: null,
    })
  })

  it('names only the links asked for: the list is what decides, not the table', async () => {
    const greetings = await dbSelectThankYouGreetingsByLinkIds([BOUQUET_LINK.id])

    expect([...greetings.keys()]).toEqual([BOUQUET_LINK.id])
  })

  // The row is there, under its code -- and no id leads to it.
  it('never answers with a greeting whose link does not exist', async () => {
    expect(await dbSelectThankYouGreetingsByLinkCodes([ORPHAN_CODE])).toHaveLength(1)

    const greetings = await dbSelectThankYouGreetingsByLinkIds([
      EMMA_LINK.id,
      PLAIN_LINK.id,
      BOUQUET_LINK.id,
      NO_SUCH_LINK,
    ])

    expect(
      [...greetings.values()].map((found) => found.greeting.transactionLinkCode),
    ).not.toContain(ORPHAN_CODE)
    expect(greetings.size).toBe(2)
  })
})

// The counts of the admin's start page. Links, greetings, pictures and events are written straight
// into their tables, each with its moments; the counts read whole tables, so the four are emptied
// before and after each block.
const MAKER_OF_LINKS = 890100
// A link's code: 24 hex characters, one for each id.
const codeOf = (id: number) => id.toString(16).padStart(24, 'a')

type LinkForFigures = {
  id: number
  createdAt: Date
  validUntil: Date
  redeemedAt?: Date
  redeemedBy?: number
  deletedAt?: Date
}

const emptyTablesOfFigures = async () => {
  await db.delete(thankYouGreetingsTable)
  await db.delete(thankYouGreetingPicturesTable)
  await db.delete(transactionLinksTable)
  await db.delete(eventsTable)
}
const writeLink = ({ id, ...moments }: LinkForFigures) =>
  db.insert(transactionLinksTable).values({
    id,
    code: codeOf(id),
    userId: MAKER_OF_LINKS,
    memo: 'Danke für Deine Hilfe!',
    ...moments,
  })
const writeGreeting = (linkId: number, createdAt: Date) =>
  db.insert(thankYouGreetingsTable).values({ transactionLinkCode: codeOf(linkId), createdAt })
const writePicture = (linkId: number, rendition: 'small' | 'large') =>
  db.insert(thankYouGreetingPicturesTable).values({
    transactionLinkCode: codeOf(linkId),
    rendition,
    width: 831,
    height: 577,
    image: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]),
    mimeType: 'image/jpeg',
  })
// An event about a member that names a link, as a registration or a redeem writes it.
const noteForLink = (type: EventType, affectedUserId: number, linkId: number, createdAt: Date) =>
  db.insert(eventsTable).values({
    type,
    affectedUserId,
    actingUserId: affectedUserId,
    involvedTransactionLinkId: linkId,
    createdAt,
  })

describe('the counts of the figures page', () => {
  const now = new Date()
  const daysAgo = (days: number): Date => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  // From twenty days back, from seven days back, all of it.
  const moments = [daysAgo(20), daysAgo(7), null]

  // The greetings: accepted yesterday by an account opened through it, with a photo in two
  // renditions; accepted thirty days ago with an account its maker had before; accepted twelve
  // days ago by an account opened through it; run out two and twenty-five days ago; open; deleted
  // (its greeting row left behind); filed twenty-five days ago and accepted five days ago, by an
  // account opened through it -- filed before the chosen day, accepted after it.
  const ACCEPTED_BY_NEW = 890001
  const ACCEPTED_BY_OLD = 890002
  const ACCEPTED_BY_NEWER = 890003
  const RAN_OUT_LATELY = 890004
  const RAN_OUT_EARLIER = 890005
  const OPEN = 890006
  const DELETED = 890007
  const ACCEPTED_LATE = 890011
  // A greeting with a photo whose link was never saved.
  const ORPHAN = 890012
  // Plain links, without a greeting: one redeemed yesterday by an account opened through it, one
  // run out two days ago, and the one the old account was opened through long ago.
  const PLAIN_ACCEPTED = 890008
  const PLAIN_RAN_OUT = 890009
  const PLAIN_OF_OLD = 890010

  // The accounts: no foreign key, numbers stand for them.
  const NEW = 890201
  const NEWER = 890202
  const OLD = 890203
  // Opened an account through the greeting OLD accepted, and accepted nothing.
  const ALSO_THROUGH_IT = 890204
  const THROUGH_PLAIN = 890205
  // Opened an account through a greeting that ran out unaccepted.
  const TOO_LATE = 890206
  const LATEST = 890207

  beforeAll(async () => {
    await emptyTablesOfFigures()
    const links: LinkForFigures[] = [
      {
        id: ACCEPTED_BY_NEW,
        createdAt: daysAgo(3),
        validUntil: daysAgo(-11),
        redeemedAt: daysAgo(1),
        redeemedBy: NEW,
      },
      {
        id: ACCEPTED_BY_OLD,
        createdAt: daysAgo(40),
        validUntil: daysAgo(26),
        redeemedAt: daysAgo(30),
        redeemedBy: OLD,
      },
      {
        id: ACCEPTED_BY_NEWER,
        createdAt: daysAgo(14),
        validUntil: daysAgo(1),
        redeemedAt: daysAgo(12),
        redeemedBy: NEWER,
      },
      { id: RAN_OUT_LATELY, createdAt: daysAgo(16), validUntil: daysAgo(2) },
      { id: RAN_OUT_EARLIER, createdAt: daysAgo(39), validUntil: daysAgo(25) },
      { id: OPEN, createdAt: daysAgo(9), validUntil: daysAgo(-5) },
      { id: DELETED, createdAt: daysAgo(17), validUntil: daysAgo(3), deletedAt: daysAgo(10) },
      {
        id: ACCEPTED_LATE,
        createdAt: daysAgo(25),
        validUntil: daysAgo(-5),
        redeemedAt: daysAgo(5),
        redeemedBy: LATEST,
      },
      {
        id: PLAIN_ACCEPTED,
        createdAt: daysAgo(4),
        validUntil: daysAgo(-10),
        redeemedAt: daysAgo(1),
        redeemedBy: THROUGH_PLAIN,
      },
      { id: PLAIN_RAN_OUT, createdAt: daysAgo(16), validUntil: daysAgo(2) },
      {
        id: PLAIN_OF_OLD,
        createdAt: daysAgo(200),
        validUntil: daysAgo(186),
        redeemedAt: daysAgo(199),
        redeemedBy: OLD,
      },
    ]
    for (const link of links) {
      await writeLink(link)
    }
    for (const id of [
      ACCEPTED_BY_NEW,
      ACCEPTED_BY_OLD,
      ACCEPTED_BY_NEWER,
      RAN_OUT_LATELY,
      RAN_OUT_EARLIER,
      OPEN,
      DELETED,
      ACCEPTED_LATE,
    ]) {
      await writeGreeting(id, links.find((link) => link.id === id)?.createdAt as Date)
    }
    await writeGreeting(ORPHAN, daysAgo(2))
    await writePicture(ACCEPTED_BY_NEW, 'small')
    await writePicture(ACCEPTED_BY_NEW, 'large')
    await writePicture(OPEN, 'large')
    await writePicture(ORPHAN, 'small')
    const redeemRegistration = EventType.USER_REGISTER_REDEEM
    await noteForLink(redeemRegistration, NEW, ACCEPTED_BY_NEW, daysAgo(1))
    await noteForLink(redeemRegistration, NEWER, ACCEPTED_BY_NEWER, daysAgo(12))
    await noteForLink(redeemRegistration, LATEST, ACCEPTED_LATE, daysAgo(5))
    await noteForLink(redeemRegistration, ALSO_THROUGH_IT, ACCEPTED_BY_OLD, daysAgo(31))
    await noteForLink(redeemRegistration, OLD, PLAIN_OF_OLD, daysAgo(200))
    await noteForLink(redeemRegistration, THROUGH_PLAIN, PLAIN_ACCEPTED, daysAgo(1))
    await noteForLink(redeemRegistration, TOO_LATE, RAN_OUT_LATELY, daysAgo(5))
    // The redeem names the link and who redeemed it as well: it is no registration.
    await noteForLink(EventType.TRANSACTION_LINK_REDEEM, OLD, ACCEPTED_BY_OLD, daysAgo(30))
  })
  afterAll(emptyTablesOfFigures)

  // Not the greeting of the deleted link, nor the one whose link was never saved.
  it('counts the greetings sent whose link stands, by the moment they were filed', async () => {
    expect((await dbCountThankYouGreetings(moments)).sent).toEqual([4, 1, 7])
  })

  it('counts of them the ones with a photo of the own, once though it is filed twice', async () => {
    expect((await dbCountThankYouGreetings(moments)).withPicture).toEqual([2, 1, 2])
  })

  // The one filed before the chosen day and accepted after it counts from the chosen day on.
  it('counts the greetings accepted, by the moment their link was redeemed, and no plain link', async () => {
    expect((await dbCountAcceptedThankYouGreetings(moments)).accepted).toEqual([3, 2, 4])
  })

  // Not one opened through a plain link, nor one opened through the greeting by somebody who did
  // not accept it, nor the redeem of an account that was there before.
  it('counts of them the ones accepted by an account opened through the greeting itself', async () => {
    expect((await dbCountAcceptedThankYouGreetings(moments)).withNewAccount).toEqual([3, 2, 3])
  })

  // Not a plain link, not an accepted one whose time is over now, not a deleted one, not an open
  // one.
  it('counts the greetings whose time ran out unaccepted, by the moment it ran out', async () => {
    expect(await dbCountExpiredThankYouGreetings(moments, now)).toEqual([1, 1, 2])
  })
})

// By calendar week, from Monday 7 September 2026, with the running week the one of 21 September
// up to its Thursday noon: in each count two in the first week -- one at its very last moment
// (a link keeps whole seconds) --, none in the week after, one in the week of 21 September (two
// accepted there, one of them filed long before), one in the week before the first.
describe('the counts of the figures page by week', () => {
  const from = new Date('2026-09-07T00:00:00.000Z')
  const now = new Date('2026-09-24T12:00:00.000Z')
  const at = (moment: string) => new Date(moment)
  const LONG_BEFORE = at('2026-08-20T12:00:00.000Z')
  const LONG_AFTER = at('2026-12-20T12:00:00.000Z')

  // Greetings filed and accepted in the weeks.
  const FIRST = 890301
  const LAST_MOMENT = 890302
  const THIRD_WEEK = 890303
  const WEEK_BEFORE = 890304
  // Greetings filed long before, whose time ran out in the weeks, or not yet, or was deleted.
  const RAN_OUT_FIRST = 890311
  const RAN_OUT_LAST_MOMENT = 890312
  const RAN_OUT_THIRD_WEEK = 890313
  const RUNS_OUT_LATER_TODAY = 890314
  const RAN_OUT_WEEK_BEFORE = 890315
  const DELETED = 890316
  // A plain link, redeemed in the first week by an account opened through it.
  const PLAIN = 890321
  // Filed long before and accepted in the week of 21 September by an account opened through it;
  // filed in the first week, its link never saved; filed in the first week, its link deleted the
  // day after (the greeting row left behind).
  const ACCEPTED_LATER = 890305
  const ORPHAN = 890306
  const DELETED_IN_WEEK = 890317

  const NEW = 890401
  const OLD = 890402
  const NEWER = 890403
  const BEFORE = 890404
  const THROUGH_PLAIN = 890405
  const LATER = 890406

  beforeAll(async () => {
    await emptyTablesOfFigures()
    const accepted: [number, string, string, number][] = [
      [FIRST, '2026-09-08T12:00:00.000Z', '2026-09-09T10:00:00.000Z', NEW],
      [LAST_MOMENT, '2026-09-13T23:59:59.999Z', '2026-09-13T23:59:59.000Z', OLD],
      [THIRD_WEEK, '2026-09-21T00:00:00.000Z', '2026-09-21T00:00:00.000Z', NEWER],
      [WEEK_BEFORE, '2026-09-06T23:59:59.999Z', '2026-09-06T23:59:59.000Z', BEFORE],
    ]
    for (const [id, filed, redeemed, by] of accepted) {
      await writeLink({
        id,
        createdAt: at(filed),
        validUntil: LONG_AFTER,
        redeemedAt: at(redeemed),
        redeemedBy: by,
      })
      await writeGreeting(id, at(filed))
    }
    await writePicture(FIRST, 'small')
    await writePicture(FIRST, 'large')
    await writePicture(THIRD_WEEK, 'small')
    await writePicture(WEEK_BEFORE, 'small')
    const ranOut: [number, string][] = [
      [RAN_OUT_FIRST, '2026-09-08T12:00:00.000Z'],
      [RAN_OUT_LAST_MOMENT, '2026-09-13T23:59:59.000Z'],
      [RAN_OUT_THIRD_WEEK, '2026-09-21T00:00:00.000Z'],
      [RUNS_OUT_LATER_TODAY, '2026-09-24T18:00:00.000Z'],
      [RAN_OUT_WEEK_BEFORE, '2026-09-06T23:59:59.000Z'],
    ]
    for (const [id, validUntil] of ranOut) {
      await writeLink({ id, createdAt: LONG_BEFORE, validUntil: at(validUntil) })
      await writeGreeting(id, LONG_BEFORE)
    }
    await writeLink({
      id: DELETED,
      createdAt: LONG_BEFORE,
      validUntil: at('2026-09-09T12:00:00.000Z'),
      deletedAt: at('2026-09-01T12:00:00.000Z'),
    })
    await writeGreeting(DELETED, LONG_BEFORE)
    await writeLink({
      id: PLAIN,
      createdAt: at('2026-09-01T12:00:00.000Z'),
      validUntil: LONG_AFTER,
      redeemedAt: at('2026-09-08T12:00:00.000Z'),
      redeemedBy: THROUGH_PLAIN,
    })
    await writeLink({
      id: ACCEPTED_LATER,
      createdAt: LONG_BEFORE,
      validUntil: LONG_AFTER,
      redeemedAt: at('2026-09-22T09:00:00.000Z'),
      redeemedBy: LATER,
    })
    await writeGreeting(ACCEPTED_LATER, LONG_BEFORE)
    await writeGreeting(ORPHAN, at('2026-09-08T13:00:00.000Z'))
    await writePicture(ORPHAN, 'small')
    await writeLink({
      id: DELETED_IN_WEEK,
      createdAt: at('2026-09-10T12:00:00.000Z'),
      validUntil: LONG_AFTER,
      deletedAt: at('2026-09-11T12:00:00.000Z'),
    })
    await writeGreeting(DELETED_IN_WEEK, at('2026-09-10T12:00:00.000Z'))
    const redeemRegistration = EventType.USER_REGISTER_REDEEM
    await noteForLink(redeemRegistration, NEW, FIRST, at('2026-09-09T10:00:00.000Z'))
    await noteForLink(redeemRegistration, NEWER, THIRD_WEEK, at('2026-09-21T00:00:00.000Z'))
    await noteForLink(redeemRegistration, BEFORE, WEEK_BEFORE, at('2026-09-06T23:59:59.000Z'))
    await noteForLink(redeemRegistration, THROUGH_PLAIN, PLAIN, at('2026-09-08T12:00:00.000Z'))
    await noteForLink(redeemRegistration, LATER, ACCEPTED_LATER, at('2026-09-22T09:00:00.000Z'))
  })
  afterAll(emptyTablesOfFigures)

  // Not the greeting whose link was never saved, nor the one whose link was deleted.
  it('counts the greetings sent in each week, and of them the ones with a photo, each once', async () => {
    expect(await dbCountThankYouGreetingsByWeek(from)).toEqual([
      { weekStart: '2026-09-07', n: 2, withPicture: 1 },
      { weekStart: '2026-09-21', n: 1, withPicture: 1 },
    ])
  })

  // In the week of the redeem, whenever the greeting was filed.
  it('counts the greetings accepted in each week, and of them the ones by an account opened through them', async () => {
    expect(await dbCountAcceptedThankYouGreetingsByWeek(from)).toEqual([
      { weekStart: '2026-09-07', n: 2, withNewAccount: 1 },
      { weekStart: '2026-09-21', n: 2, withNewAccount: 2 },
    ])
  })

  it('counts the greetings whose time ran out in each week, the running one up to now', async () => {
    expect(await dbCountExpiredThankYouGreetingsByWeek(from, now)).toEqual([
      { weekStart: '2026-09-07', n: 2 },
      { weekStart: '2026-09-21', n: 1 },
    ])
  })
})
