// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'
import { thankYouGreetingsTable } from '../schemas'
import {
  dbDeleteThankYouGreetingByLinkCode,
  dbInsertThankYouGreeting,
  dbSelectThankYouGreetingsByLinkCodes,
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
