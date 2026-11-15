// AI-GENERATED — not an architecture reference
// Unit test: the decisions of setMatchingEntryExactSentence -- whose entry it writes, what it writes,
// and what it leaves alone. The way through the database runs in MatchingEntryResolver.test.ts.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike, as AGENTS.md asks: the
// fakes are declared before `jest.mock`, each factory hands out its own fakes and every name the
// resolver imports from it, and the module under test is imported in `beforeAll`.
import type { Context } from '@/server/context'

class mockLogError extends Error {
  readonly details: unknown[]
  constructor(message: string, ...details: unknown[]) {
    super(message)
    this.details = details
  }
}
const mockDatabase = {
  dbDeleteEventMatchingArrival: jest.fn(),
  dbDeleteMatchingEntryByUuid: jest.fn(),
  dbSelectEventMatchingArrival: jest.fn(),
  dbSelectMatchingEntriesByUserId: jest.fn(),
  dbSelectMatchingEntryByUuid: jest.fn(),
  dbSetMatchingEntryActive: jest.fn(),
  dbSetMatchingEntryExactSentence: jest.fn(),
  dbSetUndecidedExactSentence: jest.fn(),
  dbUpdateMatchingEntry: jest.fn(),
}
const mockNudge = jest.fn()
const mockSyncMatchingEntryToGms = jest.fn()
const mockReadBackMatchingEntry = jest.fn()

jest.mock('@/server/LogError', () => ({ LogError: mockLogError }))
jest.mock('database', () => mockDatabase)
jest.mock('@/apis/anthropic/matching/keyingRun', () => ({
  matchingKeyingRun: { nudge: mockNudge },
}))
jest.mock('./util/syncMatchingEntryToGms', () => ({
  syncMatchingEntryToGms: mockSyncMatchingEntryToGms,
  removeMatchingEntryFromGms: jest.fn(),
}))
jest.mock('./util/createMatchingEntryFor', () => ({
  createMatchingEntryFor: jest.fn(),
  readBackMatchingEntry: mockReadBackMatchingEntry,
}))
jest.mock('./util/makeEventMatchingEntry', () => ({ EVENT_ENTRY_KIND: 'interest' }))
jest.mock('@/interactions/registerUser', () => ({ eventMatchingEntrySchema: {} }))
jest.mock('@/data/MemberLine.logic', () => ({ inMemberLine: jest.fn() }))

const ENTRY = '3f1c0000-0000-4000-8000-000000000001'
const LENA = 7

const row = (fields: Record<string, unknown> = {}) => ({
  uuid: ENTRY,
  userId: LENA,
  matchingType: 'interest',
  summary: 'Ich liebe Kongress Frequency Healing',
  details: null,
  remote: true,
  active: true,
  createdAt: new Date('2026-11-14T18:00:00.000Z'),
  updatedAt: new Date('2026-11-15T14:00:00.000Z'),
  keyedAt: null,
  exactSentence: null,
  ...fields,
})

type ResolverModule = typeof import('./MatchingEntryResolver')
let MatchingEntryResolver: ResolverModule['MatchingEntryResolver']

beforeAll(async () => {
  ;({ MatchingEntryResolver } = await import('./MatchingEntryResolver'))
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
})

const lenasRequest = (): Context => ({ user: { id: LENA } }) as unknown as Context

const tick = (exactSentence: boolean) =>
  new MatchingEntryResolver().setMatchingEntryExactSentence(ENTRY, exactSentence, lenasRequest())

describe('setMatchingEntryExactSentence', () => {
  it.each([[true], [false]])(
    "writes %s on the member's own entry and answers with the entry as it now stands",
    async (value) => {
      mockDatabase.dbSelectMatchingEntryByUuid.mockResolvedValue({ success: true, value: row() })
      mockDatabase.dbSetMatchingEntryExactSentence.mockResolvedValue({ success: true })
      mockReadBackMatchingEntry.mockResolvedValue(row({ exactSentence: value }))

      const answer = await tick(value)

      expect(mockDatabase.dbSetMatchingEntryExactSentence).toHaveBeenCalledWith(ENTRY, value)
      expect(answer).toMatchObject({ uuid: ENTRY, exactSentence: value })
    },
  )

  // The tick decides what the member's own map asks for, not how others find them (KA-020).
  it('tells the GMS nothing and does not nudge the keying', async () => {
    mockDatabase.dbSelectMatchingEntryByUuid.mockResolvedValue({ success: true, value: row() })
    mockDatabase.dbSetMatchingEntryExactSentence.mockResolvedValue({ success: true })
    mockReadBackMatchingEntry.mockResolvedValue(row({ exactSentence: true }))

    await tick(true)

    expect(mockSyncMatchingEntryToGms).not.toHaveBeenCalled()
    expect(mockNudge).not.toHaveBeenCalled()
  })

  // A paused entry is still the member's own; the map offers no tick for it, the call does not care.
  it('writes it on a paused entry, which stays paused', async () => {
    mockDatabase.dbSelectMatchingEntryByUuid.mockResolvedValue({
      success: true,
      value: row({ active: false }),
    })
    mockDatabase.dbSetMatchingEntryExactSentence.mockResolvedValue({ success: true })
    mockReadBackMatchingEntry.mockResolvedValue(row({ active: false, exactSentence: true }))

    const answer = await tick(true)

    expect(mockDatabase.dbSetMatchingEntryExactSentence).toHaveBeenCalledWith(ENTRY, true)
    expect(mockDatabase.dbSetMatchingEntryActive).not.toHaveBeenCalled()
    expect(answer).toMatchObject({ active: false, exactSentence: true })
  })

  it("refuses another member's entry and writes nothing", async () => {
    mockDatabase.dbSelectMatchingEntryByUuid.mockResolvedValue({
      success: true,
      value: row({ userId: LENA + 1 }),
    })

    const refused = await tick(true).catch((error: unknown) => error)

    expect((refused as mockLogError).message).toBe('Can not access MatchingEntry of another user')
    expect(mockDatabase.dbSetMatchingEntryExactSentence).not.toHaveBeenCalled()
  })

  it('refuses an entry that is not there and writes nothing', async () => {
    mockDatabase.dbSelectMatchingEntryByUuid.mockResolvedValue({
      success: false,
      error: new Error('DB_NOT_FOUND'),
    })

    const refused = await tick(false).catch((error: unknown) => error)

    expect((refused as mockLogError).message).toBe('MatchingEntry not found')
    expect(mockDatabase.dbSetMatchingEntryExactSentence).not.toHaveBeenCalled()
  })

  it('says so where the entry was gone by the time of the write', async () => {
    mockDatabase.dbSelectMatchingEntryByUuid.mockResolvedValue({ success: true, value: row() })
    mockDatabase.dbSetMatchingEntryExactSentence.mockResolvedValue({
      success: false,
      error: new Error('DB_NOT_FOUND'),
    })

    const refused = await tick(true).catch((error: unknown) => error)

    expect((refused as mockLogError).message).toBe('Could not change MatchingEntry state')
    expect(mockReadBackMatchingEntry).not.toHaveBeenCalled()
  })
})
