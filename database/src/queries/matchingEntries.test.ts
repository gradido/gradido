// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { matchingEntriesTable, usersTable } from '../schemas'
import {
  dbDeleteMatchingEntryByUuid,
  dbInsertMatchingEntry,
  dbSelectActiveMatchingEntriesByUserIds,
  dbSelectMatchingEntriesByUserId,
  dbSelectMatchingEntriesNeedingKeying,
  dbSelectMatchingEntryByUuid,
  dbSelectPublishableMatchingEntry,
  dbSetMatchingEntryActive,
  dbUpdateMatchingEntry,
  dbWriteMatchingEntryKeying,
  type MatchingEntryKeying,
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
    const result = await dbUpdateMatchingEntry((await rowOf('uuid-offer'))!, {
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

    const result = await dbUpdateMatchingEntry(before!, unchanged)
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
    await dbUpdateMatchingEntry(before!, {
      matchingType: before!.matchingType,
      summary: before!.summary,
      details: before!.details,
      remote: before!.remote,
    })

    const after = await rowOf('uuid-offer')
    expect(after!.updatedAt.getTime()).toBeGreaterThan(backdated.getTime())
  })

  it('should report a missing entry when updating one that is not there', async () => {
    const gone = { ...(await rowOf('uuid-offer'))!, uuid: 'uuid-does-not-exist' }
    const result = await dbUpdateMatchingEntry(gone, {
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

// The words a language model works out for an entry, and the two things that decide
// when they are worth anything: whether they still describe what the member wrote, and
// whether the member agreed to be published at all.
describe('the keying of a matching entry', () => {
  const KEYED = 901
  const NOT_ALLOWED = 902
  const DELETED = 903
  const FOREIGN = 904

  const keying = (overrides: Partial<MatchingEntryKeying> = {}): MatchingEntryKeying => ({
    keyWords: ['fahrradreparatur', 'fahrrad'],
    keySubject: 'fahrrad',
    keyActivity: 'reparieren',
    keyCategory: 'reparatur',
    keyArea: 'mobilitaet',
    keyActor: 'fahrradmechaniker',
    keySoughtActor: null,
    keyTraits: ['professionell'],
    instructionVersion: 'gms176-1',
    ...overrides,
  })

  const anEntry = async (uuid: string, userId: number, summary: string, active = true) => {
    await dbDeleteMatchingEntryByUuid(uuid)
    await dbInsertMatchingEntry({
      uuid,
      userId,
      matchingType: 'OFFER',
      summary,
      details: null,
      remote: false,
      active,
    })
  }

  beforeAll(async () => {
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [KEYED, NOT_ALLOWED, DELETED, FOREIGN]))
    await db.insert(usersTable).values([
      {
        id: KEYED,
        gradidoId: '90000000-0000-4000-8000-000000000901',
        language: 'de',
        gmsAllowed: 1,
      },
      // A member who has NOT agreed to take part in the GMS. Their entries stay in
      // their own list and must never be keyed: the words would land in a table every
      // community reads, and they declined exactly that.
      {
        id: NOT_ALLOWED,
        gradidoId: '90000000-0000-4000-8000-000000000902',
        language: 'de',
        gmsAllowed: 0,
      },
      // A member who deleted their account. Only soft-deleted, so nothing but the
      // query itself stops their entries from being worked out.
      {
        id: DELETED,
        gradidoId: '90000000-0000-4000-8000-000000000903',
        language: 'de',
        gmsAllowed: 1,
        deletedAt: new Date(),
      },
      // A member of ANOTHER community, as the federation stores them: same table,
      // same shape. No local path gives such a row an entry - this builds the state
      // the query must refuse rather than the state it happens to avoid.
      {
        id: FOREIGN,
        gradidoId: '90000000-0000-4000-8000-000000000904',
        language: 'de',
        gmsAllowed: 1,
        foreign: 1,
        communityUuid: '99999999-9999-4999-8999-999999999999',
      },
    ])
  })

  afterEach(async () => {
    await db.delete(matchingEntriesTable)
  })

  afterAll(async () => {
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [KEYED, NOT_ALLOWED, DELETED, FOREIGN]))
  })

  describe('dbWriteMatchingEntryKeying', () => {
    it('stores what the model worked out', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')

      const written = await dbWriteMatchingEntryKeying(
        'uuid-key-1',
        'Ich repariere Fahrraeder',
        'OFFER',
        keying(),
      )
      expect(written.success).toBe(true)

      const row = await rowOf('uuid-key-1')
      expect(row).toMatchObject({
        keyWords: ['fahrradreparatur', 'fahrrad'],
        keySubject: 'fahrrad',
        keyActor: 'fahrradmechaniker',
        keyTraits: ['professionell'],
        instructionVersion: 'gms176-1',
      })
      expect(row!.keyedAt).not.toBeNull()
    })

    // ⭐ The race this guard is for: between reading an entry for the keying run and
    // writing the answer, the member rewrote it - and that rewrite already cleared the
    // keying to schedule a fresh one. Writing anyway would pin words about the OLD
    // sentence onto the new entry, and nothing would notice: the row would look keyed.
    it('refuses to write words about a sentence the member has replaced', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')

      const written = await dbWriteMatchingEntryKeying(
        'uuid-key-1',
        'Ich gebe Klavierunterricht',
        'OFFER',
        keying(),
      )
      expect(written.success).toBe(false)

      const row = await rowOf('uuid-key-1')
      expect(row!.keyWords).toBeNull()
      expect(row!.instructionVersion).toBeNull()
    })

    // The channel is given to the model, and the instruction fills `gesuchter_beruf`
    // only on the "sucht" one - so an offer flipped to a need gets a different keying.
    // Guarding on the sentence alone would let an in-flight call write the offer's
    // words onto the need, set the instruction version, and drop it off the list for
    // good.
    it('refuses to write words computed for the other channel', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')

      const written = await dbWriteMatchingEntryKeying(
        'uuid-key-1',
        'Ich repariere Fahrraeder',
        'NEED',
        keying(),
      )
      expect(written.success).toBe(false)
      expect((await rowOf('uuid-key-1'))!.keyWords).toBeNull()
    })
  })

  describe('dbUpdateMatchingEntry and the keying', () => {
    it('clears the keying when the member rewrites the sentence', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await dbWriteMatchingEntryKeying('uuid-key-1', 'Ich repariere Fahrraeder', 'OFFER', keying())

      const stored = (await rowOf('uuid-key-1'))!
      await dbUpdateMatchingEntry(stored, {
        matchingType: stored.matchingType,
        summary: 'Ich gebe Klavierunterricht',
        details: null,
        remote: false,
      })

      // Gone, and the NULL is at the same time what puts the entry back on the list.
      const row = await rowOf('uuid-key-1')
      expect(row!.summary).toBe('Ich gebe Klavierunterricht')
      expect(row!.keyWords).toBeNull()
      expect(row!.keySubject).toBeNull()
      expect(row!.instructionVersion).toBeNull()
      expect(row!.keyedAt).toBeNull()
    })

    it('clears it on a change of channel too, which the model is told about', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await dbWriteMatchingEntryKeying('uuid-key-1', 'Ich repariere Fahrraeder', 'OFFER', keying())

      const stored = (await rowOf('uuid-key-1'))!
      await dbUpdateMatchingEntry(stored, {
        matchingType: 'NEED',
        summary: stored.summary,
        details: null,
        remote: false,
      })

      expect((await rowOf('uuid-key-1'))!.keyWords).toBeNull()
    })

    it('keeps it when only something beside the sentence changed', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await dbWriteMatchingEntryKeying('uuid-key-1', 'Ich repariere Fahrraeder', 'OFFER', keying())

      const stored = (await rowOf('uuid-key-1'))!
      await dbUpdateMatchingEntry(stored, {
        matchingType: stored.matchingType,
        summary: stored.summary,
        details: 'Jetzt auch Lastenraeder',
        remote: true,
      })

      // A corrected price must not cost a model call.
      const row = await rowOf('uuid-key-1')
      expect(row!.details).toBe('Jetzt auch Lastenraeder')
      expect(row!.keyWords).toEqual(['fahrradreparatur', 'fahrrad'])
      expect(row!.instructionVersion).toBe('gms176-1')
    })
  })

  // ⛔ The read that stands between a member pausing their entry and that entry
  // reappearing in everyone's search. A model call takes seconds; everything this
  // guards against happens in seconds.
  describe('dbSelectPublishableMatchingEntry', () => {
    it('gives back the entry as it stands NOW, not as it was read before', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      const before = (await rowOf('uuid-key-1'))!

      // The member corrects a price while the model call is out. That does not clear
      // the keying - rightly, the sentence is unchanged - so nothing else would stop
      // the run from publishing the old text over the correction.
      await dbUpdateMatchingEntry(before, {
        matchingType: before.matchingType,
        summary: before.summary,
        details: 'Jetzt 20 Euro die Stunde',
        remote: false,
      })

      const fresh = await dbSelectPublishableMatchingEntry('uuid-key-1')
      expect(fresh?.entry.details).toBe('Jetzt 20 Euro die Stunde')
      expect(fresh?.userGradidoId).toBe('90000000-0000-4000-8000-000000000901')
    })

    // Pausing DELETES the entry from the GMS. Publishing it after that would put it
    // back into the global search, and nothing anywhere would remove it again.
    it('gives back nothing for an entry the member has paused', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await dbSetMatchingEntryActive('uuid-key-1', false)

      expect(await dbSelectPublishableMatchingEntry('uuid-key-1')).toBeUndefined()
    })

    it('gives back nothing for a member who has left the GMS', async () => {
      await anEntry('uuid-key-2', NOT_ALLOWED, 'Ich backe Brot')

      expect(await dbSelectPublishableMatchingEntry('uuid-key-2')).toBeUndefined()
    })

    it('gives back nothing for a member who deleted their account', async () => {
      await anEntry('uuid-key-4', DELETED, 'Ich verleihe Werkzeug')

      expect(await dbSelectPublishableMatchingEntry('uuid-key-4')).toBeUndefined()
    })

    it('gives back nothing for a member of another community', async () => {
      await anEntry('uuid-key-5', FOREIGN, 'Ich mache Fotos')

      expect(await dbSelectPublishableMatchingEntry('uuid-key-5')).toBeUndefined()
    })

    it('gives back nothing for an entry that is gone', async () => {
      expect(await dbSelectPublishableMatchingEntry('uuid-does-not-exist')).toBeUndefined()
    })
  })

  describe('dbSelectMatchingEntriesNeedingKeying', () => {
    it('finds an entry that was never keyed', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')

      const pending = await dbSelectMatchingEntriesNeedingKeying('gms176-1', 10)
      expect(pending.map((row) => row.entry.uuid)).toEqual(['uuid-key-1'])
      expect(pending[0].userLanguage).toBe('de')
      expect(pending[0].userGradidoId).toBe('90000000-0000-4000-8000-000000000901')
    })

    it('leaves an entry alone once it carries the current instruction', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await dbWriteMatchingEntryKeying('uuid-key-1', 'Ich repariere Fahrraeder', 'OFFER', keying())

      expect(await dbSelectMatchingEntriesNeedingKeying('gms176-1', 10)).toEqual([])
    })

    // ★ The one that makes "improve the instruction on real entries" a routine rather
    // than a one-way street: raise the version and every entry is work again.
    it('finds an entry again when the instruction has moved on', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await dbWriteMatchingEntryKeying('uuid-key-1', 'Ich repariere Fahrraeder', 'OFFER', keying())

      const pending = await dbSelectMatchingEntriesNeedingKeying('gms176-2', 10)
      expect(pending.map((row) => row.entry.uuid)).toEqual(['uuid-key-1'])
    })

    it('leaves out a paused entry, which nobody can find anyway', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder', false)

      expect(await dbSelectMatchingEntriesNeedingKeying('gms176-1', 10)).toEqual([])
    })

    // ⛔ Keying sends words derived from what a member wrote into a table every
    // community reads. A member who declined publication declined that too.
    it('leaves out the entry of a member who is not in the GMS', async () => {
      await anEntry('uuid-key-2', NOT_ALLOWED, 'Ich backe Brot')

      expect(await dbSelectMatchingEntriesNeedingKeying('gms176-1', 10)).toEqual([])
    })

    // ⛔ The account is gone and so is the GMS copy. Words coined out of what they
    // wrote would be the one trace of them that outlives the deletion, in a table
    // every community reads.
    it('leaves out the entry of a member who deleted their account', async () => {
      await anEntry('uuid-key-4', DELETED, 'Ich verleihe Werkzeug')

      expect(await dbSelectMatchingEntriesNeedingKeying('gms176-1', 10)).toEqual([])
    })

    it('leaves out the entry of a member of another community', async () => {
      await anEntry('uuid-key-5', FOREIGN, 'Ich mache Fotos')

      expect(await dbSelectMatchingEntriesNeedingKeying('gms176-1', 10)).toEqual([])
    })

    it('honours the limit and takes the oldest first', async () => {
      await anEntry('uuid-key-1', KEYED, 'Ich repariere Fahrraeder')
      await anEntry('uuid-key-3', KEYED, 'Ich backe Brot')

      const pending = await dbSelectMatchingEntriesNeedingKeying('gms176-1', 1)
      expect(pending.map((row) => row.entry.uuid)).toEqual(['uuid-key-1'])
    })
  })
})
