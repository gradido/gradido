// AI-GENERATED — not an architecture reference
import { inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'
import { thankYouGreetingsTable, transactionLinksTable } from '../schemas'
import {
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
        userId: 1,
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
    const emma = greetings.get(EMMA_LINK.id)
    expect(emma).toMatchObject(EMMA)
    // The whole row of the greeting, as the link lists read it: its own id among it, which
    // is not the link's.
    expect(emma?.id).toBeGreaterThan(0)
    expect(emma?.id).not.toBe(EMMA_LINK.id)
    expect(emma?.createdAt).toBeInstanceOf(Date)
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
    expect(greetings.get(EMMA_LINK.id)).toMatchObject(EMMA)
    expect(greetings.get(BOUQUET_LINK.id)).toMatchObject({
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

    expect([...greetings.values()].map((greeting) => greeting.transactionLinkCode)).not.toContain(
      ORPHAN_CODE,
    )
    expect(greetings.size).toBe(2)
  })
})
