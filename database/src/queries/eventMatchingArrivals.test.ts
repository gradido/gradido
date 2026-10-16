// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { eventMatchingArrivalsTable } from '../schemas'
import {
  dbDeleteEventMatchingArrival,
  dbMarkEventMatchingArrival,
  dbSelectEventMatchingArrival,
} from './eventMatchingArrivals'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No account and no entry stand behind these: the table has no foreign key, and what is asked
// here is the row itself.
const MAREN = 4711
const JONAS = 4712
const MARENS_ENTRY = '4a7f3c2e-9b1d-4e8a-a6f0-1c2d3e4f5a6b'
const JONAS_ENTRY = '8c9d0e1f-2a3b-4c5d-8e6f-7a8b9c0d1e2f'

const arrivalOf = async (userId: number) => {
  const rows = await db
    .select()
    .from(eventMatchingArrivalsTable)
    .where(eq(eventMatchingArrivalsTable.userId, userId))
  return rows
}

class Undone extends Error {}
/** Runs `work` in a transaction that is taken back afterwards. */
const undone = async (work: (tx: DrizzleTransaction) => Promise<unknown>) => {
  await db
    .transaction(async (tx: DrizzleTransaction) => {
      await work(tx)
      throw new Undone()
    })
    .catch((error) => {
      if (!(error instanceof Undone)) {
        throw error
      }
    })
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
})
beforeEach(async () => {
  await db.delete(eventMatchingArrivalsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('eventMatchingArrivals query test', () => {
  describe('dbMarkEventMatchingArrival', () => {
    it('notes at the account that the invitation is due, naming the entry', async () => {
      const before = Date.now()
      await dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY)

      const rows = await arrivalOf(MAREN)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ userId: MAREN, matchingEntryUuid: MARENS_ENTRY })
      // The database's own clock, to the millisecond; a second of slack for two clocks.
      expect(rows[0].createdAt.getTime()).toBeGreaterThan(before - 1000)
    })

    // A refusal would take the entry down with it, in the transaction that makes it.
    it('replaces a row that is there already instead of failing, and keeps one', async () => {
      await dbMarkEventMatchingArrival(MAREN, JONAS_ENTRY)
      await dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY)

      const rows = await arrivalOf(MAREN)
      expect(rows).toHaveLength(1)
      expect(rows[0].matchingEntryUuid).toBe(MARENS_ENTRY)
    })

    it('notes one for each of two accounts', async () => {
      await dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY)
      await dbMarkEventMatchingArrival(JONAS, JONAS_ENTRY)

      expect((await arrivalOf(MAREN))[0].matchingEntryUuid).toBe(MARENS_ENTRY)
      expect((await arrivalOf(JONAS))[0].matchingEntryUuid).toBe(JONAS_ENTRY)
    })

    // Written with the entry it names: both, or neither.
    it('goes back with the transaction it was written in', async () => {
      await undone((tx) => dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY, tx))

      expect(await arrivalOf(MAREN)).toEqual([])
    })

    it('stays with a transaction that goes through', async () => {
      await db.transaction((tx: DrizzleTransaction) =>
        dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY, tx),
      )

      expect((await arrivalOf(MAREN))[0].matchingEntryUuid).toBe(MARENS_ENTRY)
    })
  })

  describe('dbSelectEventMatchingArrival', () => {
    it('hands over the invitation that is due at the account', async () => {
      await dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY)

      expect(await dbSelectEventMatchingArrival(MAREN)).toMatchObject({
        userId: MAREN,
        matchingEntryUuid: MARENS_ENTRY,
      })
    })

    it('hands over nothing for an account at which none is due', async () => {
      await dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY)

      expect(await dbSelectEventMatchingArrival(JONAS)).toBeUndefined()
    })
  })

  describe('dbDeleteEventMatchingArrival', () => {
    it("takes the account's invitation away, and only that one", async () => {
      await dbMarkEventMatchingArrival(MAREN, MARENS_ENTRY)
      await dbMarkEventMatchingArrival(JONAS, JONAS_ENTRY)

      await dbDeleteEventMatchingArrival(MAREN)

      expect(await dbSelectEventMatchingArrival(MAREN)).toBeUndefined()
      expect((await dbSelectEventMatchingArrival(JONAS))?.matchingEntryUuid).toBe(JONAS_ENTRY)
    })

    // Two tabs may both say it.
    it('does nothing where none is due', async () => {
      await expect(dbDeleteEventMatchingArrival(MAREN)).resolves.toBeUndefined()
      await expect(dbDeleteEventMatchingArrival(MAREN)).resolves.toBeUndefined()
    })
  })
})
