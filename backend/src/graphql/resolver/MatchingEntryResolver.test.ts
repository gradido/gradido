// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  dbMarkEventMatchingArrival,
  dbSelectMatchingEntriesByUserId,
  dbSelectMatchingEntryByUuid,
  dbWriteMatchingEntryKeying,
  MatchingEntrySelect,
  User,
} from 'database'
import { GraphQLError } from 'graphql'
import { MATCHING_ENTRY_DETAILS_MAX_CHARS, MATCHING_ENTRY_SUMMARY_MAX_CHARS } from 'shared'
import { matchingKeyingRun } from '@/apis/anthropic/matching/keyingRun'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import {
  acceptEventMatchingEntry,
  createMatchingEntry,
  deleteMatchingEntry,
  login,
  setMatchingEntryActive,
  settleEventMatchingArrival,
  updateMatchingEntry,
} from '@/seeds/graphql/mutations'
import {
  eventMatchingArrival,
  listMatchingEntries,
  listMatchingEntriesKeyed,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { syncMatchingEntryToGms } from './util/syncMatchingEntryToGms'

// Passed through to the database, so that one test can hold the first read of a member's entries
// (the same link opened twice at once).
jest.mock('database', () => {
  const actual = jest.requireActual('database')
  return {
    ...actual,
    dbSelectMatchingEntriesByUserId: jest.fn(actual.dbSelectMatchingEntriesByUserId),
  }
})

// Passed through to the real hand-over, and counted: acceptEventMatchingEntry has to hand a new
// entry to the GMS, and nothing that was there already. (A spy cannot wrap the module's export
// here -- ts-jest defines it as a property that cannot be redefined.)
jest.mock('./util/syncMatchingEntryToGms', () => {
  const actual = jest.requireActual('./util/syncMatchingEntryToGms')
  return { ...actual, syncMatchingEntryToGms: jest.fn(actual.syncMatchingEntryToGms) }
})

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

// a well-formed uuid that never belongs to a seeded entry
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000'

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let bibi: User
let bob: User

/**
 * matching_entries is a drizzle table, so cleanDB() does not reach it — that one walks
 * the TypeORM entities. Raw SQL over the existing connection keeps this to one line and
 * avoids opening a second pool just to tidy up.
 */
const clearEntries = async (): Promise<void> => {
  await db.getDataSource().query('DELETE FROM matching_entries')
}

/** The stored row, read through the query layer its own test covers separately. */
const entryByUuid = async (uuid: string): Promise<MatchingEntrySelect> => {
  const result = await dbSelectMatchingEntryByUuid(uuid)
  if (!result.success) {
    throw new Error(`expected a matching entry with uuid ${uuid}, found none`)
  }
  return result.value
}

const entryExists = async (uuid: string): Promise<boolean> => {
  return (await dbSelectMatchingEntryByUuid(uuid)).success
}

const loginBibi = async (): Promise<void> => {
  await mutate({
    mutation: login,
    variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
  })
}

const loginBob = async (): Promise<void> => {
  await mutate({
    mutation: login,
    variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
  })
}

// creates an entry as the currently logged-in user and returns its uuid
const seedEntry = async (input: Record<string, unknown>): Promise<string> => {
  const res: any = await mutate({ mutation: createMatchingEntry, variables: { input } })
  if (res.errors) {
    throw new Error(`seedEntry failed: ${JSON.stringify(res.errors)}`)
  }
  return res.data.createMatchingEntry.uuid
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await clearEntries()
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
})

afterAll(async () => {
  await clearEntries()
  await cleanDB()
  await db.destroy()
})

describe('MatchingEntryResolver', () => {
  describe('createMatchingEntry', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        resetToken()
        const { errors: errorObjects } = await mutate({
          mutation: createMatchingEntry,
          variables: { input: { matchingType: 'offer', summary: 'I offer bike repair' } },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await clearEntries()
        await loginBibi()
      })

      it('creates an entry and applies the defaults', async () => {
        const res: any = await mutate({
          mutation: createMatchingEntry,
          variables: { input: { matchingType: 'offer', summary: 'I offer bike repair' } },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.createMatchingEntry).toMatchObject({
          uuid: expect.any(String),
          matchingType: 'offer',
          summary: 'I offer bike repair',
          details: null,
          remote: false,
          active: true,
        })
      })

      it('persists all fields with the correct owner', async () => {
        const res: any = await mutate({
          mutation: createMatchingEntry,
          variables: {
            input: {
              matchingType: 'need',
              summary: 'I need a piano teacher',
              details: 'preferably on weekday evenings',
              remote: true,
            },
          },
        })
        const dbEntry = await entryByUuid(res.data.createMatchingEntry.uuid)
        expect(dbEntry).toMatchObject({
          userId: bibi.id,
          matchingType: 'need',
          summary: 'I need a piano teacher',
          details: 'preferably on weekday evenings',
          remote: true,
          active: true,
        })
      })

      it('rejects an invalid matchingType', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: createMatchingEntry,
          variables: { input: { matchingType: 'nonsense', summary: 'x' } },
        })
        expect(errorObjects).toMatchObject([
          {
            message: 'Argument Validation Error',
            extensions: {
              validationErrors: [{ property: 'matchingType' }],
            },
          },
        ])
      })

      it('rejects a summary longer than 160 characters', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: createMatchingEntry,
          variables: { input: { matchingType: 'offer', summary: 'x'.repeat(161) } },
        })
        expect(errorObjects).toMatchObject([
          {
            message: 'Argument Validation Error',
            extensions: {
              validationErrors: [{ property: 'summary' }],
            },
          },
        ])
      })

      // details is a `text` column, so the database bound is 65535 BYTES and hitting it
      // would surface as a raw driver error. It is also forwarded to the GMS, so the cap
      // bounds the payload as well.
      it('rejects details longer than the cap', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: createMatchingEntry,
          variables: {
            input: {
              matchingType: 'offer',
              summary: 'x',
              details: 'y'.repeat(MATCHING_ENTRY_DETAILS_MAX_CHARS + 1),
            },
          },
        })
        expect(errorObjects).toMatchObject([
          {
            message: 'Argument Validation Error',
            extensions: {
              validationErrors: [{ property: 'details' }],
            },
          },
        ])
      })
    })
  })

  describe('acceptEventMatchingEntry', () => {
    const SENTENCE = 'Kongress Frequency Healing'
    const offered = {
      summary: SENTENCE,
      details: 'Online, 1.-10. November',
      remote: true,
    }

    const accept = (eventMatchingEntry: Record<string, unknown>): Promise<any> =>
      mutate({ mutation: acceptEventMatchingEntry, variables: { eventMatchingEntry } })

    // Bibi's entries with the link's words, of any kind, as the database holds them.
    const bibisWith = async (summary: string): Promise<MatchingEntrySelect[]> =>
      (await dbSelectMatchingEntriesByUserId(bibi.id)).filter(
        (entry) => entry.summary.trim().toLowerCase() === summary.trim().toLowerCase(),
      )

    const syncSpy = syncMatchingEntryToGms as jest.Mock
    let nudgeSpy: jest.SpyInstance

    beforeEach(async () => {
      await clearEntries()
      await loginBibi()
      syncSpy.mockClear()
      nudgeSpy = jest.spyOn(matchingKeyingRun, 'nudge')
    })

    afterEach(() => {
      nudgeSpy.mockRestore()
    })

    describe('unauthenticated', () => {
      it('returns an error and makes nothing', async () => {
        resetToken()
        const { errors: errorObjects } = await accept(offered)
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
        expect(await bibisWith(SENTENCE)).toHaveLength(0)
      })
    })

    it('makes the entry where the member has none: a live interest, found from afar as the link says', async () => {
      const res = await accept(offered)
      expect(res.errors).toBeUndefined()
      expect(res.data.acceptEventMatchingEntry).toMatchObject({
        created: true,
        entry: {
          uuid: expect.any(String),
          matchingType: 'interest',
          summary: SENTENCE,
          details: 'Online, 1.-10. November',
          remote: true,
          active: true,
        },
      })
      const stored = await bibisWith(SENTENCE)
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        uuid: res.data.acceptEventMatchingEntry.entry.uuid,
        userId: bibi.id,
        matchingType: 'interest',
        remote: true,
        active: true,
      })
    })

    it('hands the new entry to the GMS and tells the keying run, as a saved one is', async () => {
      const res = await accept(offered)
      expect(syncSpy).toHaveBeenCalledTimes(1)
      expect(syncSpy.mock.calls[0][0]).toMatchObject({ id: bibi.id })
      expect(syncSpy.mock.calls[0][1]).toMatchObject({
        uuid: res.data.acceptEventMatchingEntry.entry.uuid,
      })
      expect(nudgeSpy).toHaveBeenCalledTimes(1)
    })

    it('takes "found from afar: no" as the link says it', async () => {
      const res = await accept({ ...offered, remote: false })
      expect(res.data.acceptEventMatchingEntry.entry.remote).toBe(false)
    })

    it('stores the words trimmed and blank details as none', async () => {
      const res = await accept({ summary: `  ${SENTENCE} `, details: '   ', remote: true })
      expect(res.data.acceptEventMatchingEntry.entry).toMatchObject({
        summary: SENTENCE,
        details: null,
      })
    })

    it('answers created: false where the member has the entry live, and makes no second one', async () => {
      const first = await accept(offered)
      syncSpy.mockClear()
      nudgeSpy.mockClear()
      const second = await accept(offered)
      expect(second.errors).toBeUndefined()
      expect(second.data.acceptEventMatchingEntry).toMatchObject({
        created: false,
        entry: { uuid: first.data.acceptEventMatchingEntry.entry.uuid, active: true },
      })
      expect(await bibisWith(SENTENCE)).toHaveLength(1)
      expect(syncSpy).not.toHaveBeenCalled()
      expect(nudgeSpy).not.toHaveBeenCalled()
    })

    it('answers created: false where the member has paused the entry, and leaves it paused', async () => {
      const first = await accept(offered)
      const uuid = first.data.acceptEventMatchingEntry.entry.uuid
      await mutate({ mutation: setMatchingEntryActive, variables: { uuid, active: false } })
      syncSpy.mockClear()
      const second = await accept(offered)
      expect(second.data.acceptEventMatchingEntry).toMatchObject({
        created: false,
        entry: { uuid, active: false },
      })
      expect(await bibisWith(SENTENCE)).toHaveLength(1)
      expect((await entryByUuid(uuid)).active).toBe(false)
      expect(syncSpy).not.toHaveBeenCalled()
    })

    it('counts the same words in another case and with blanks around them as there', async () => {
      await seedEntry({ matchingType: 'interest', summary: 'kongress FREQUENCY healing' })
      const res = await accept({ ...offered, summary: `  ${SENTENCE.toUpperCase()}  ` })
      expect(res.data.acceptEventMatchingEntry.created).toBe(false)
      expect(res.data.acceptEventMatchingEntry.entry.summary).toBe('kongress FREQUENCY healing')
      expect(await bibisWith(SENTENCE)).toHaveLength(1)
    })

    it('does not count an offer with the same words: it is another kind', async () => {
      await seedEntry({ matchingType: 'offer', summary: SENTENCE })
      const res = await accept(offered)
      expect(res.data.acceptEventMatchingEntry).toMatchObject({
        created: true,
        entry: { matchingType: 'interest' },
      })
      expect(await bibisWith(SENTENCE)).toHaveLength(2)
    })

    it('does not count other words of the same kind', async () => {
      await seedEntry({ matchingType: 'interest', summary: `${SENTENCE} 2027` })
      const res = await accept(offered)
      expect(res.data.acceptEventMatchingEntry.created).toBe(true)
    })

    it("does not count another member's entry with the same words", async () => {
      await loginBob()
      await accept(offered)
      await loginBibi()
      const res = await accept(offered)
      expect(res.data.acceptEventMatchingEntry.created).toBe(true)
      expect(await bibisWith(SENTENCE)).toHaveLength(1)
    })

    it('makes the entry anew after the member deleted it', async () => {
      const first = await accept(offered)
      const uuid = first.data.acceptEventMatchingEntry.entry.uuid
      await mutate({ mutation: deleteMatchingEntry, variables: { uuid } })
      const again = await accept(offered)
      expect(again.data.acceptEventMatchingEntry.created).toBe(true)
      expect(again.data.acceptEventMatchingEntry.entry.uuid).not.toBe(uuid)
      expect(await bibisWith(SENTENCE)).toHaveLength(1)
    })

    /**
     * The first call's read of the member's entries is held until the second call has finished
     * or has waited a second. Without the member's line the second reads "not there" while the
     * first is held, and both make the entry; with it the second waits for the first, and finds
     * it. Held on purpose: two calls left to themselves overlap only by chance.
     */
    it('makes one entry for the same link opened twice at once', async () => {
      const select = dbSelectMatchingEntriesByUserId as jest.Mock
      select.mockClear()
      const { dbSelectMatchingEntriesByUserId: read } = jest.requireActual('database')
      let release: () => void = () => undefined
      const held = new Promise<void>((resolve) => (release = resolve))
      select.mockImplementationOnce(async (...args: unknown[]) => {
        const rows = await read(...args)
        await held
        return rows
      })
      const first = accept(offered)
      for (let i = 0; i < 200 && select.mock.calls.length === 0; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      expect(select).toHaveBeenCalled()
      const second = accept(offered)
      await Promise.race([second, new Promise((resolve) => setTimeout(resolve, 1000))])
      release()
      const answers = await Promise.all([first, second])
      expect(answers.map((res) => res.errors)).toEqual([undefined, undefined])
      expect(answers.map((res) => res.data.acceptEventMatchingEntry.created)).toEqual([true, false])
      expect(await bibisWith(SENTENCE)).toHaveLength(1)
    })

    it('refuses a sentence longer than an entry holds, and makes nothing', async () => {
      const res = await accept({
        ...offered,
        summary: 'x'.repeat(MATCHING_ENTRY_SUMMARY_MAX_CHARS + 1),
      })
      expect(res.errors).toHaveLength(1)
      expect(res.data).toBeNull()
      expect(await dbSelectMatchingEntriesByUserId(bibi.id)).toHaveLength(0)
    })

    it('takes a sentence of exactly the length an entry holds', async () => {
      const res = await accept({
        ...offered,
        summary: 'x'.repeat(MATCHING_ENTRY_SUMMARY_MAX_CHARS),
      })
      expect(res.errors).toBeUndefined()
      expect(res.data.acceptEventMatchingEntry.created).toBe(true)
    })

    it('refuses a blank sentence, and makes nothing', async () => {
      const res = await accept({ ...offered, summary: '   ' })
      expect(res.errors).toHaveLength(1)
      expect(await dbSelectMatchingEntriesByUserId(bibi.id)).toHaveLength(0)
    })

    it('refuses details longer than an entry holds, and makes nothing', async () => {
      const res = await accept({
        ...offered,
        details: 'y'.repeat(MATCHING_ENTRY_DETAILS_MAX_CHARS + 1),
      })
      expect(res.errors).toHaveLength(1)
      expect(await dbSelectMatchingEntriesByUserId(bibi.id)).toHaveLength(0)
    })

    it('keeps the words out of the refusal', async () => {
      const words = `${'Geheimnis '.repeat(16)}x`
      const res = await accept({ ...offered, summary: words })
      expect(res.errors[0].message).not.toContain('Geheimnis')
    })
  })

  /**
   * The invitation onto the map after an event link (KA-015): noted at the account by the
   * confirmation that makes the entry (makeEventMatchingEntry, held in UserResolver.test.ts),
   * asked by the wallet after a sign-in, taken away once it had the screen. Noted here straight
   * through the query layer, which its own test covers.
   */
  describe('eventMatchingArrival and settleEventMatchingArrival', () => {
    const SENTENCE = 'Kongress Frequency Healing'
    const asked = (): Promise<any> => query({ query: eventMatchingArrival })
    const settle = (): Promise<any> => mutate({ mutation: settleEventMatchingArrival })

    beforeEach(async () => {
      await clearEntries()
      await db.getDataSource().query('DELETE FROM event_matching_arrivals')
      await loginBibi()
    })

    describe('unauthenticated', () => {
      it('returns an error for both, and leaves the invitation where it is', async () => {
        const uuid = await seedEntry({ matchingType: 'interest', summary: SENTENCE })
        await dbMarkEventMatchingArrival(bibi.id, uuid)
        resetToken()

        expect((await asked()).errors).toEqual([new GraphQLError('401 Unauthorized')])
        expect((await settle()).errors).toEqual([new GraphQLError('401 Unauthorized')])
        await loginBibi()
        expect((await asked()).data.eventMatchingArrival).toBe(SENTENCE)
      })
    })

    it('answers null where no invitation is due', async () => {
      await seedEntry({ matchingType: 'interest', summary: SENTENCE })

      const res = await asked()
      expect(res.errors).toBeUndefined()
      expect(res.data.eventMatchingArrival).toBeNull()
    })

    it('names the sentence of the entry the invitation is for', async () => {
      const uuid = await seedEntry({ matchingType: 'interest', summary: SENTENCE })
      await dbMarkEventMatchingArrival(bibi.id, uuid)

      const res = await asked()
      expect(res.errors).toBeUndefined()
      expect(res.data.eventMatchingArrival).toBe(SENTENCE)
    })

    // Read off the entry, never kept beside it.
    it('names the sentence as it stands, where the member has changed it since', async () => {
      const uuid = await seedEntry({ matchingType: 'interest', summary: SENTENCE })
      await dbMarkEventMatchingArrival(bibi.id, uuid)
      await mutate({
        mutation: updateMatchingEntry,
        variables: { uuid, input: { matchingType: 'interest', summary: `${SENTENCE} 2026` } },
      })

      expect((await asked()).data.eventMatchingArrival).toBe(`${SENTENCE} 2026`)
    })

    it('answers null where the entry is gone', async () => {
      const uuid = await seedEntry({ matchingType: 'interest', summary: SENTENCE })
      await dbMarkEventMatchingArrival(bibi.id, uuid)
      await mutate({ mutation: deleteMatchingEntry, variables: { uuid } })

      expect((await asked()).data.eventMatchingArrival).toBeNull()
    })

    // ⛔ Only the member's own entry is ever named: a row that pointed at somebody else's would
    // hand out that member's words.
    it('never names an entry of another member, whatever the row points at', async () => {
      await loginBob()
      const bobs = await seedEntry({ matchingType: 'interest', summary: 'Bob loves bricks' })
      await loginBibi()
      await dbMarkEventMatchingArrival(bibi.id, bobs)

      const res = await asked()
      expect(res.errors).toBeUndefined()
      expect(res.data.eventMatchingArrival).toBeNull()
    })

    it('answers every member for their own account', async () => {
      const uuid = await seedEntry({ matchingType: 'interest', summary: SENTENCE })
      await dbMarkEventMatchingArrival(bibi.id, uuid)
      await loginBob()

      expect((await asked()).data.eventMatchingArrival).toBeNull()
    })

    it('is over once settled -- for the member who settles it, and for nobody else', async () => {
      const uuid = await seedEntry({ matchingType: 'interest', summary: SENTENCE })
      await dbMarkEventMatchingArrival(bibi.id, uuid)
      await loginBob()
      const bobs = await seedEntry({ matchingType: 'interest', summary: 'Bob loves bricks' })
      await dbMarkEventMatchingArrival(bob.id, bobs)
      await loginBibi()

      const res = await settle()
      expect(res.errors).toBeUndefined()
      expect(res.data.settleEventMatchingArrival).toBe(true)
      expect((await asked()).data.eventMatchingArrival).toBeNull()
      // The entry stays: only the invitation is over.
      expect(await entryExists(uuid)).toBe(true)
      await loginBob()
      expect((await asked()).data.eventMatchingArrival).toBe('Bob loves bricks')
    })

    // Two tabs may both say it.
    it('settles where none is due as well', async () => {
      const res = await settle()

      expect(res.errors).toBeUndefined()
      expect(res.data.settleEventMatchingArrival).toBe(true)
    })
  })

  describe('listMatchingEntries', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        resetToken()
        const { errors: errorObjects } = await query({ query: listMatchingEntries })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await clearEntries()
        await loginBibi()
        await seedEntry({ matchingType: 'offer', summary: 'Bibi offers flying lessons' })
        await seedEntry({ matchingType: 'interest', summary: 'Bibi loves witchcraft' })
        await loginBob()
        await seedEntry({ matchingType: 'need', summary: 'Bob needs bricks' })
      })

      it('returns only the entries of the logged-in user', async () => {
        await loginBibi()
        const res: any = await query({ query: listMatchingEntries })
        const summaries = res.data.listMatchingEntries.map((entry: any) => entry.summary).sort()
        expect(summaries).toEqual(['Bibi loves witchcraft', 'Bibi offers flying lessons'])

        await loginBob()
        const resBob: any = await query({ query: listMatchingEntries })
        expect(resBob.data.listMatchingEntries.map((entry: any) => entry.summary)).toEqual([
          'Bob needs bricks',
        ])
      })
    })

    /**
     * Whether an entry has its words: the map asks again while one has none (the GMS finds
     * with an entry only once it has them). A new entry has none, the keying run gives them,
     * and an edit takes them away again until the run has been round.
     */
    describe('keyed', () => {
      const keyedOf = async (uuid: string): Promise<boolean> => {
        const res: any = await query({ query: listMatchingEntriesKeyed })
        return res.data.listMatchingEntries.find((entry: any) => entry.uuid === uuid).keyed
      }

      it('is false for a new entry, true once the words are written, false again after an edit', async () => {
        await clearEntries()
        await loginBibi()
        const uuid = await seedEntry({ matchingType: 'interest', summary: 'Kongress X' })
        expect(await keyedOf(uuid)).toBe(false)

        const written = await dbWriteMatchingEntryKeying(await entryByUuid(uuid), {
          keyWords: ['kongress'],
          keySubject: 'kongress',
          keyActivity: null,
          keyCategory: null,
          keyArea: null,
          keyActor: null,
          keySoughtActor: null,
          keyTraits: [],
          instructionVersion: 'test',
        })
        expect(written.success).toBe(true)
        expect(await keyedOf(uuid)).toBe(true)

        await mutate({
          mutation: updateMatchingEntry,
          variables: { uuid, input: { matchingType: 'interest', summary: 'Kongress Y' } },
        })
        expect(await keyedOf(uuid)).toBe(false)
      })
    })

    describe('ordering', () => {
      let firstUuid: string
      let secondUuid: string

      beforeAll(async () => {
        await clearEntries()
        await loginBibi()
        firstUuid = await seedEntry({ matchingType: 'offer', summary: 'newer entry' })
        secondUuid = await seedEntry({ matchingType: 'offer', summary: 'older entry' })
        // Force distinct update timestamps directly. Creating both entries within
        // the same millisecond would leave the DESC order undefined on a fast CI
        // runner, so we set updated_at a day apart via raw SQL — going through the
        // query layer would stamp it with the current time instead.
        await db
          .getDataSource()
          .query('UPDATE matching_entries SET updated_at = ? WHERE uuid = ?', [
            '2024-01-02 00:00:00.000',
            firstUuid,
          ])
        await db
          .getDataSource()
          .query('UPDATE matching_entries SET updated_at = ? WHERE uuid = ?', [
            '2024-01-01 00:00:00.000',
            secondUuid,
          ])
      })

      it('lists entries ordered by updatedAt descending', async () => {
        const res: any = await query({ query: listMatchingEntries })
        const uuids = res.data.listMatchingEntries.map((entry: any) => entry.uuid)
        expect(uuids).toEqual([firstUuid, secondUuid])
      })
    })
  })

  describe('updateMatchingEntry', () => {
    let uuid: string

    describe('unauthenticated', () => {
      it('returns an error', async () => {
        resetToken()
        const { errors: errorObjects } = await mutate({
          mutation: updateMatchingEntry,
          variables: {
            uuid: NON_EXISTENT_UUID,
            input: { matchingType: 'offer', summary: 'x' },
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await clearEntries()
        await loginBibi()
        uuid = await seedEntry({ matchingType: 'offer', summary: 'original summary' })
      })

      it('updates the fields of an own entry', async () => {
        const res: any = await mutate({
          mutation: updateMatchingEntry,
          variables: {
            uuid,
            input: {
              matchingType: 'need',
              summary: 'changed summary',
              details: 'now with details',
              remote: true,
            },
          },
        })
        expect(res.data.updateMatchingEntry).toMatchObject({
          uuid,
          matchingType: 'need',
          summary: 'changed summary',
          details: 'now with details',
          remote: true,
        })
        const dbEntry = await entryByUuid(uuid)
        expect(dbEntry).toMatchObject({
          matchingType: 'need',
          summary: 'changed summary',
          remote: true,
        })
      })

      it('clears optional fields back to their defaults when omitted', async () => {
        const res: any = await mutate({
          mutation: updateMatchingEntry,
          variables: {
            uuid,
            input: { matchingType: 'offer', summary: 'no more details' },
          },
        })
        expect(res.data.updateMatchingEntry).toMatchObject({
          details: null,
          remote: false,
        })
      })

      // Saving an unchanged entry is the commonest edit of all, and it is the one that
      // touches no column. It has to come back as a success rather than as "no such
      // entry" - the query layer's own test pins down why it does.
      it('reports success when nothing was actually changed', async () => {
        const res: any = await mutate({
          mutation: updateMatchingEntry,
          variables: {
            uuid,
            input: { matchingType: 'offer', summary: 'no more details' },
          },
        })
        expect(res.errors).toBeUndefined()
        expect(res.data.updateMatchingEntry).toMatchObject({ uuid, summary: 'no more details' })
      })

      describe('entry does not exist', () => {
        it('returns an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateMatchingEntry,
              variables: {
                uuid: NON_EXISTENT_UUID,
                input: { matchingType: 'offer', summary: 'x' },
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({ errors: [new GraphQLError('MatchingEntry not found')] }),
          )
        })

        it('logs the error "MatchingEntry not found"', () => {
          expect(logErrorLogger.error).toHaveBeenCalledWith(
            'MatchingEntry not found',
            NON_EXISTENT_UUID,
          )
        })
      })

      describe('another user tries to update the entry', () => {
        beforeAll(async () => {
          await loginBob()
        })

        afterAll(async () => {
          await loginBibi()
        })

        it('returns an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateMatchingEntry,
              variables: {
                uuid,
                input: { matchingType: 'offer', summary: 'hijacked' },
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Can not access MatchingEntry of another user')],
            }),
          )
        })

        it('logs the error "Can not access MatchingEntry of another user"', () => {
          expect(logErrorLogger.error).toHaveBeenCalledWith(
            'Can not access MatchingEntry of another user',
            uuid,
            bob.id,
          )
        })

        it('leaves the entry unchanged', async () => {
          const dbEntry = await entryByUuid(uuid)
          expect(dbEntry.summary).toBe('no more details')
        })
      })
    })
  })

  describe('setMatchingEntryActive', () => {
    let uuid: string

    beforeAll(async () => {
      await clearEntries()
      await loginBibi()
      uuid = await seedEntry({ matchingType: 'offer', summary: 'toggle me' })
    })

    it('deactivates an own entry', async () => {
      const res: any = await mutate({
        mutation: setMatchingEntryActive,
        variables: { uuid, active: false },
      })
      expect(res.data.setMatchingEntryActive).toMatchObject({ uuid, active: false })
      const dbEntry = await entryByUuid(uuid)
      expect(dbEntry.active).toBe(false)
    })

    it('reactivates an own entry', async () => {
      const res: any = await mutate({
        mutation: setMatchingEntryActive,
        variables: { uuid, active: true },
      })
      expect(res.data.setMatchingEntryActive).toMatchObject({ uuid, active: true })
      const dbEntry = await entryByUuid(uuid)
      expect(dbEntry.active).toBe(true)
    })

    // Same reasoning as the unchanged save above.
    it('reports success when pausing an entry that is already paused', async () => {
      await mutate({ mutation: setMatchingEntryActive, variables: { uuid, active: false } })
      const res: any = await mutate({
        mutation: setMatchingEntryActive,
        variables: { uuid, active: false },
      })
      expect(res.errors).toBeUndefined()
      expect(res.data.setMatchingEntryActive).toMatchObject({ uuid, active: false })
      await mutate({ mutation: setMatchingEntryActive, variables: { uuid, active: true } })
    })

    describe('another user tries to toggle the entry', () => {
      beforeAll(async () => {
        await loginBob()
      })

      afterAll(async () => {
        await loginBibi()
      })

      it('returns an error', async () => {
        await expect(
          mutate({ mutation: setMatchingEntryActive, variables: { uuid, active: false } }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Can not access MatchingEntry of another user')],
          }),
        )
      })
    })
  })

  describe('deleteMatchingEntry', () => {
    let uuid: string

    describe('unauthenticated', () => {
      it('returns an error', async () => {
        resetToken()
        const { errors: errorObjects } = await mutate({
          mutation: deleteMatchingEntry,
          variables: { uuid: NON_EXISTENT_UUID },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await clearEntries()
        await loginBibi()
        uuid = await seedEntry({ matchingType: 'offer', summary: 'delete me' })
      })

      describe('another user tries to delete the entry', () => {
        beforeAll(async () => {
          await loginBob()
        })

        afterAll(async () => {
          await loginBibi()
        })

        it('returns an error', async () => {
          await expect(
            mutate({ mutation: deleteMatchingEntry, variables: { uuid } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Can not access MatchingEntry of another user')],
            }),
          )
        })

        it('keeps the entry in the database', async () => {
          expect(await entryExists(uuid)).toBe(true)
        })
      })

      describe('entry does not exist', () => {
        it('returns an error', async () => {
          await expect(
            mutate({ mutation: deleteMatchingEntry, variables: { uuid: NON_EXISTENT_UUID } }),
          ).resolves.toEqual(
            expect.objectContaining({ errors: [new GraphQLError('MatchingEntry not found')] }),
          )
        })
      })

      it('hard-deletes an own entry', async () => {
        const res: any = await mutate({ mutation: deleteMatchingEntry, variables: { uuid } })
        expect(res.data.deleteMatchingEntry).toBe(true)
        expect(await entryExists(uuid)).toBe(false)
      })
    })
  })
})
