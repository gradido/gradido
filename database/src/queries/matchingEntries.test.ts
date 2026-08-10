// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { matchingEntriesTable } from '../schemas'
import {
  dbDeleteMatchingEntryByUuid,
  dbInsertMatchingEntry,
  dbSelectActiveMatchingEntriesByUserIds,
  dbSelectMatchingEntriesByUserId,
  dbSelectMatchingEntryByUuid,
  dbSetMatchingEntryActive,
  dbUpdateMatchingEntry,
} from './matchingEntries'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const rowOf = async (uuid: string) => {
  const rows = await db
    .select()
    .from(matchingEntriesTable)
    .where(eq(matchingEntriesTable.uuid, uuid))
  return rows.at(0)
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(matchingEntriesTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('matchingEntries query test', () => {
  it('should insert a new matching entry', async () => {
    const result = await dbInsertMatchingEntry({
      uuid: 'uuid-offer',
      userId: 1,
      matchingType: 'OFFER',
      summary: 'Ich repariere Fahrraeder',
      details: 'Auch Lastenraeder',
      remote: false,
      active: true,
    })
    expect(result.success).toBe(true)

    const rows = await db.select().from(matchingEntriesTable)
    expect(rows).toHaveLength(1)
    expect(rows).toMatchObject([
      { uuid: 'uuid-offer', userId: 1, matchingType: 'OFFER', summary: 'Ich repariere Fahrraeder' },
    ])
  })

  // These two values are forwarded to the GMS as JSON. The column is tinyint(1), so a
  // plain tinyint() mapping would hand out 1 and 0 — true and false is what the outside
  // has always been given, and what the GraphQL layer declares.
  it('should read remote and active back as booleans, not as 1 and 0', async () => {
    const row = await rowOf('uuid-offer')
    expect(row?.remote).toBe(false)
    expect(row?.active).toBe(true)
  })

  it('should find an entry by its uuid', async () => {
    const result = await dbSelectMatchingEntryByUuid('uuid-offer')
    expect(result.success).toBe(true)
    expect(result.success && result.value.summary).toBe('Ich repariere Fahrraeder')
  })

  // Not scoped to an owner on purpose: the caller has to be able to tell "no such entry"
  // from "not yours", because it reports the two differently.
  it('should find an entry regardless of who owns it', async () => {
    const result = await dbSelectMatchingEntryByUuid('uuid-offer')
    expect(result.success && result.value.userId).toBe(1)
  })

  it('should report a missing entry as an expected failure', async () => {
    const result = await dbSelectMatchingEntryByUuid('uuid-does-not-exist')
    expect(result.success).toBe(false)
  })

  it('should list a members own entries, newest change first', async () => {
    await db.insert(matchingEntriesTable).values([
      {
        uuid: 'uuid-edited-long-ago',
        userId: 2,
        matchingType: 'NEED',
        summary: 'Suche Kinderbetreuung',
        details: null,
        remote: false,
        active: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        uuid: 'uuid-edited-recently',
        userId: 2,
        matchingType: 'INTEREST',
        summary: 'Permakultur',
        details: null,
        remote: true,
        active: true,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ])

    const entries = await dbSelectMatchingEntriesByUserId(2)
    expect(entries.map((entry) => entry.uuid)).toEqual([
      'uuid-edited-recently',
      'uuid-edited-long-ago',
    ])
  })

  // The list a member manages is not the list others can find: a paused entry stays here
  // and disappears only from the GMS.
  it('should list paused entries too, because they are still the members own', async () => {
    await dbSetMatchingEntryActive('uuid-edited-long-ago', false)
    const entries = await dbSelectMatchingEntriesByUserId(2)
    expect(entries).toHaveLength(2)
  })

  it('should return an empty list for a member without entries', async () => {
    expect(await dbSelectMatchingEntriesByUserId(999)).toEqual([])
  })

  it('should collect the live entries of several members and leave the paused ones out', async () => {
    const entries = await dbSelectActiveMatchingEntriesByUserIds([1, 2])
    expect(entries.map((entry) => entry.uuid).sort()).toEqual([
      'uuid-edited-recently',
      'uuid-offer',
    ])
  })

  // Guards the early return: inArray with no values has no meaningful SQL form, so this
  // must not reach the database at all.
  it('should answer an empty list of members without asking the database', async () => {
    expect(await dbSelectActiveMatchingEntriesByUserIds([])).toEqual([])
  })

  it('should overwrite what the member wrote', async () => {
    const result = await dbUpdateMatchingEntry('uuid-offer', {
      matchingType: 'OFFER',
      summary: 'Ich repariere Fahrraeder und Lastenraeder',
      details: null,
      remote: true,
    })
    expect(result.success).toBe(true)

    const row = await rowOf('uuid-offer')
    expect(row).toMatchObject({
      summary: 'Ich repariere Fahrraeder und Lastenraeder',
      details: null,
      remote: true,
    })
  })

  // Saving without editing is the commonest write there is. mysql2 connects with
  // FOUND_ROWS, so the row is reported as affected even though no value changed — this
  // pins that down, because the success check is written against `affectedRows === 1`
  // and would turn the whole case into "no such entry" if the flag ever went away.
  it('should report success when the member saves without changing anything', async () => {
    const before = await rowOf('uuid-offer')
    const unchanged = {
      matchingType: before!.matchingType,
      summary: before!.summary,
      details: before!.details,
      remote: before!.remote,
    }

    const result = await dbUpdateMatchingEntry('uuid-offer', unchanged)
    expect(result.success).toBe(true)
  })

  // What the stamp in the query is actually for. MySQL's ON UPDATE clause fires only
  // when some value changes, so on an unchanged save the column would stand still and
  // the entry would keep its old place in a list ordered by it. Backdated first,
  // because two writes in the same millisecond would prove nothing.
  it('should move an unchanged save up in the list order', async () => {
    const backdated = new Date('2024-01-01T00:00:00.000Z')
    await db
      .update(matchingEntriesTable)
      .set({ updatedAt: backdated })
      .where(eq(matchingEntriesTable.uuid, 'uuid-offer'))

    const before = await rowOf('uuid-offer')
    await dbUpdateMatchingEntry('uuid-offer', {
      matchingType: before!.matchingType,
      summary: before!.summary,
      details: before!.details,
      remote: before!.remote,
    })

    const after = await rowOf('uuid-offer')
    expect(after!.updatedAt.getTime()).toBeGreaterThan(backdated.getTime())
  })

  it('should report a missing entry when updating one that is not there', async () => {
    const result = await dbUpdateMatchingEntry('uuid-does-not-exist', {
      matchingType: 'OFFER',
      summary: 'nichts',
      details: null,
      remote: false,
    })
    expect(result.success).toBe(false)
  })

  it('should pause and resume an entry', async () => {
    expect((await dbSetMatchingEntryActive('uuid-offer', false)).success).toBe(true)
    expect((await rowOf('uuid-offer'))?.active).toBe(false)

    expect((await dbSetMatchingEntryActive('uuid-offer', true)).success).toBe(true)
    expect((await rowOf('uuid-offer'))?.active).toBe(true)
  })

  // Same reasoning as the unchanged save above.
  it('should report success when pausing an entry that is already paused', async () => {
    await dbSetMatchingEntryActive('uuid-offer', false)
    const result = await dbSetMatchingEntryActive('uuid-offer', false)
    expect(result.success).toBe(true)
  })

  it('should report a missing entry when pausing one that is not there', async () => {
    const result = await dbSetMatchingEntryActive('uuid-does-not-exist', false)
    expect(result.success).toBe(false)
  })

  it('should delete an entry', async () => {
    const result = await dbDeleteMatchingEntryByUuid('uuid-offer')
    expect(result.success).toBe(true)
    expect(await rowOf('uuid-offer')).toBeUndefined()
  })

  it('should report a missing entry when deleting one that is already gone', async () => {
    const result = await dbDeleteMatchingEntryByUuid('uuid-offer')
    expect(result.success).toBe(false)
  })
})
