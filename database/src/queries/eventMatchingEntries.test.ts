// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { eventMatchingEntriesTable, matchingEntriesTable } from '../schemas'
import {
  dbHasEventMatchingEntry,
  dbInsertEventMatchingEntry,
  dbTakeEventMatchingEntry,
} from './eventMatchingEntries'
import { dbInsertMatchingEntry } from './matchingEntries'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No account stands behind these numbers: the table has no foreign key, and what is asked
// here is the row itself.
const MAREN = 4711
const JONAS = 4712

const noted = async (userId: number) => {
  const rows = await db
    .select()
    .from(eventMatchingEntriesTable)
    .where(eq(eventMatchingEntriesTable.userId, userId))
  return rows.at(0)
}
const entriesOf = (userId: number) =>
  db.select().from(matchingEntriesTable).where(eq(matchingEntriesTable.userId, userId))

/** Takes the entry noted for `userId`, in a transaction of its own that goes through. */
const take = (userId: number) =>
  db.transaction((tx: DrizzleTransaction) => dbTakeEventMatchingEntry(userId, tx))

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
  await db.delete(eventMatchingEntriesTable)
  await db.delete(matchingEntriesTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('eventMatchingEntries query test', () => {
  describe('dbInsertEventMatchingEntry', () => {
    it('notes the entry at the account, waiting', async () => {
      const before = Date.now()
      const result = await dbInsertEventMatchingEntry({
        userId: MAREN,
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung, Biohacking, Longevity',
        remote: true,
      })

      expect(result.success).toBe(true)
      const row = await noted(MAREN)
      expect(row).toMatchObject({
        userId: MAREN,
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung, Biohacking, Longevity',
        remote: true,
      })
      // The database's own clock, to the millisecond; a second of slack for two clocks.
      expect(row?.createdAt.getTime()).toBeGreaterThan(before - 1000)
    })

    // The two values go on into an entry and from there to the GMS as JSON: true and false,
    // not 1 and 0.
    it('keeps "only where the member lives" and no details as they were given', async () => {
      await dbInsertEventMatchingEntry({
        userId: MAREN,
        summary: 'Training Rücken ohne Bewegung',
        details: null,
        remote: false,
      })

      const row = await noted(MAREN)
      expect(row?.remote).toBe(false)
      expect(row?.details).toBeNull()
    })

    // The column's own answer where a caller says nothing: a link that names no reach is
    // found from afar.
    it('notes an entry found from afar where nothing is said about it', async () => {
      await dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress X' })

      expect((await noted(MAREN))?.remote).toBe(true)
    })

    it('keeps a sentence of 160 characters whole, umlauts and emoji among them', async () => {
      const summary = `Kongress für Ökologie 🌱 ${'x'.repeat(160)}`.slice(0, 160)
      await dbInsertEventMatchingEntry({ userId: MAREN, summary })

      expect((await noted(MAREN))?.summary).toBe(summary)
    })

    it('notes one entry an account: a second one is refused, and the first stays', async () => {
      await dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress A' })

      await expect(
        dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress B' }),
      ).rejects.toThrow()
      expect((await noted(MAREN))?.summary).toBe('Kongress A')
    })

    it('notes an entry each for two accounts', async () => {
      await dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress A' })
      await dbInsertEventMatchingEntry({ userId: JONAS, summary: 'Kongress B' })

      expect((await noted(MAREN))?.summary).toBe('Kongress A')
      expect((await noted(JONAS))?.summary).toBe('Kongress B')
    })

    // The registration notes it with the account it opens: both, or neither.
    it('goes back with the transaction it was written in', async () => {
      await undone((tx) => dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress A' }, tx))

      expect(await noted(MAREN)).toBeUndefined()
    })

    it('stays with a transaction that goes through', async () => {
      await db.transaction((tx: DrizzleTransaction) =>
        dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress A' }, tx),
      )

      expect((await noted(MAREN))?.summary).toBe('Kongress A')
    })
  })

  describe('dbHasEventMatchingEntry', () => {
    it('says whether an entry waits at the account', async () => {
      await dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress A' })

      expect(await dbHasEventMatchingEntry(MAREN)).toBe(true)
      expect(await dbHasEventMatchingEntry(JONAS)).toBe(false)
    })

    it('says no once the entry was taken', async () => {
      await dbInsertEventMatchingEntry({ userId: MAREN, summary: 'Kongress A' })
      await take(MAREN)

      expect(await dbHasEventMatchingEntry(MAREN)).toBe(false)
    })
  })

  describe('dbTakeEventMatchingEntry', () => {
    beforeEach(async () => {
      await dbInsertEventMatchingEntry({
        userId: MAREN,
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung',
        remote: true,
      })
    })

    it('hands over the entry that waits, and removes the note', async () => {
      const waiting = await noted(MAREN)

      expect(await take(MAREN)).toEqual(waiting)
      expect(waiting).toMatchObject({
        userId: MAREN,
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung',
        remote: true,
      })
      // Nothing is kept: once the entry is made, its words are the member's entry.
      expect(await noted(MAREN)).toBeUndefined()
    })

    it('hands it over once: the second time there is none', async () => {
      await take(MAREN)

      expect(await take(MAREN)).toBeUndefined()
    })

    it('hands over nothing for an account without an event link', async () => {
      expect(await take(JONAS)).toBeUndefined()
      // And leaves the entry of the account beside it waiting.
      expect((await noted(MAREN))?.summary).toBe('Kongress Frequency Healing')
    })

    it("takes only the account's own entry", async () => {
      await dbInsertEventMatchingEntry({ userId: JONAS, summary: 'Kongress B' })

      expect((await take(JONAS))?.summary).toBe('Kongress B')
      expect((await noted(MAREN))?.summary).toBe('Kongress Frequency Healing')
      expect((await take(MAREN))?.summary).toBe('Kongress Frequency Healing')
    })

    it('keeps what the note said: only where the member lives, and no details', async () => {
      await dbInsertEventMatchingEntry({
        userId: JONAS,
        summary: 'Training Rücken ohne Bewegung',
        details: null,
        remote: false,
      })

      expect(await take(JONAS)).toMatchObject({
        summary: 'Training Rücken ohne Bewegung',
        details: null,
        remote: false,
      })
    })

    /**
     * ⛔ What the confirmation rests on: the note goes and the entry is made together, or
     * neither. Where making the entry fails after the note was taken, the note comes back --
     * or the entry would be lost for good, taken and never made.
     */
    it('lets the note come back with the transaction, and the entry waits again', async () => {
      let taken: unknown
      await undone(async (tx) => {
        taken = await dbTakeEventMatchingEntry(MAREN, tx)
      })

      expect(taken).toMatchObject({ summary: 'Kongress Frequency Healing' })
      expect((await noted(MAREN))?.summary).toBe('Kongress Frequency Healing')
      // The next confirmation finds it.
      expect((await take(MAREN))?.summary).toBe('Kongress Frequency Healing')
    })

    it('takes the note and makes the entry in one transaction: the entry stands, the note is gone', async () => {
      await db.transaction(async (tx: DrizzleTransaction) => {
        const taken = await dbTakeEventMatchingEntry(MAREN, tx)
        await dbInsertMatchingEntry(
          {
            uuid: 'event-entry-uuid',
            userId: MAREN,
            matchingType: 'interest',
            summary: taken?.summary ?? '',
            details: taken?.details ?? null,
            remote: taken?.remote ?? false,
            active: true,
          },
          tx,
        )
      })

      expect(await noted(MAREN)).toBeUndefined()
      expect(await entriesOf(MAREN)).toMatchObject([
        { uuid: 'event-entry-uuid', summary: 'Kongress Frequency Healing', remote: true },
      ])
    })

    it('does neither where the entry cannot be written: the note comes back with it', async () => {
      await dbInsertMatchingEntry({
        uuid: 'taken-uuid',
        userId: JONAS,
        matchingType: 'offer',
        summary: 'Fahrradreparatur',
        details: null,
        remote: false,
        active: true,
      })

      await expect(
        db.transaction(async (tx: DrizzleTransaction) => {
          await dbTakeEventMatchingEntry(MAREN, tx)
          // The uuid is taken: the unique key refuses the row, and the transaction ends.
          await dbInsertMatchingEntry(
            {
              uuid: 'taken-uuid',
              userId: MAREN,
              matchingType: 'interest',
              summary: 'Kongress Frequency Healing',
              details: null,
              remote: true,
              active: true,
            },
            tx,
          )
        }),
      ).rejects.toThrow()

      expect((await noted(MAREN))?.summary).toBe('Kongress Frequency Healing')
      expect(await entriesOf(MAREN)).toHaveLength(0)
    })

    /**
     * Two confirmations at the same moment -- the button pressed twice, the mail open in two
     * tabs. Each runs in a transaction of its own, and both may read the note before either
     * has removed it; the delete of the second then waits for the row the first holds, and
     * finds none. One entry is made, not two.
     */
    it('hands the entry to one of two that ask at the same moment', async () => {
      const made: number[] = []
      const confirm = (n: number) =>
        db.transaction(async (tx: DrizzleTransaction) => {
          const taken = await dbTakeEventMatchingEntry(MAREN, tx)
          if (!taken) {
            return false
          }
          // Held for a moment with the note taken and nothing written for good yet, so that
          // the other one arrives while this one is under way.
          await new Promise((resolve) => setTimeout(resolve, 150))
          await dbInsertMatchingEntry(
            {
              uuid: `event-entry-${n}`,
              userId: MAREN,
              matchingType: 'interest',
              summary: taken.summary,
              details: taken.details,
              remote: taken.remote,
              active: true,
            },
            tx,
          )
          made.push(n)
          return true
        })

      const answers = await Promise.all([confirm(1), confirm(2)])

      expect(answers.filter(Boolean)).toHaveLength(1)
      expect(made).toHaveLength(1)
      expect(await entriesOf(MAREN)).toHaveLength(1)
      expect(await noted(MAREN)).toBeUndefined()
    })

    // The other half of the same moment: the first one fails after it took the note. The
    // second, which waited for that row, then finds it again and makes the entry.
    it('hands the entry to the second where the first one fell through', async () => {
      let firstHoldsTheNote: () => void = () => undefined
      const held = new Promise<void>((resolve) => {
        firstHoldsTheNote = resolve
      })
      const first = db
        .transaction(async (tx: DrizzleTransaction) => {
          await dbTakeEventMatchingEntry(MAREN, tx)
          firstHoldsTheNote()
          await new Promise((resolve) => setTimeout(resolve, 150))
          throw new Undone()
        })
        .catch((error) => {
          if (!(error instanceof Undone)) {
            throw error
          }
        })
      await held

      const second = await take(MAREN)
      await first

      expect(second?.summary).toBe('Kongress Frequency Healing')
      expect(await noted(MAREN)).toBeUndefined()
    })
  })
})
