// AI-GENERATED — not an architecture reference
import {
  User as DbUser,
  dbInsertMatchingEntry,
  dbSelectMatchingEntryByUuid,
  MatchingEntryInsert,
  MatchingEntrySelect,
} from 'database'
import { matchingKeyingRun } from '@/apis/anthropic/matching/keyingRun'
import {
  createMatchingEntryFor,
  newMatchingEntryRow,
  readBackMatchingEntry,
} from './createMatchingEntryFor'
import { syncMatchingEntryToGms } from './syncMatchingEntryToGms'

/**
 * The steps of a new entry, without a database: what is stored, what is read back, what the
 * GMS and the keying run are told, and in which order. That the wallet's "save" takes them is
 * held by the resolver's own tests, which have a database.
 */
jest.mock('database', () => ({
  __esModule: true,
  ...jest.requireActual('database'),
  dbInsertMatchingEntry: jest.fn(),
  dbSelectMatchingEntryByUuid: jest.fn(),
}))
jest.mock('./syncMatchingEntryToGms', () => ({ syncMatchingEntryToGms: jest.fn() }))
jest.mock('@/apis/anthropic/matching/keyingRun', () => ({
  matchingKeyingRun: { nudge: jest.fn() },
}))

const insertMock = dbInsertMatchingEntry as jest.Mock
const selectMock = dbSelectMatchingEntryByUuid as jest.Mock
const syncMock = syncMatchingEntryToGms as jest.Mock
const nudgeMock = matchingKeyingRun.nudge as jest.Mock

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const bibi = { id: 7, gradidoID: 'bibis-gradido-id', gmsAllowed: true } as unknown as DbUser
const content = {
  matchingType: 'offer',
  summary: 'Lastenrad zum Ausleihen',
  details: 'Mit Kindersitz.',
  remote: false,
}

/** The row the database answers a read with: what was stored, and the two dates it adds. */
const stored = (row: MatchingEntryInsert): MatchingEntrySelect =>
  ({
    id: 3,
    ...row,
    createdAt: new Date('2026-10-13T18:00:00.000Z'),
    updatedAt: new Date('2026-10-13T18:00:00.000Z'),
  }) as unknown as MatchingEntrySelect

const storedRow = (): MatchingEntryInsert => insertMock.mock.calls[0][0]

// A database that stores every row and answers a read with the row it stored.
beforeEach(() => {
  jest.clearAllMocks()
  insertMock.mockResolvedValue({ success: true })
  selectMock.mockImplementation(async () => ({ success: true, value: stored(storedRow()) }))
  syncMock.mockResolvedValue(undefined)
})

describe('newMatchingEntryRow', () => {
  it('is the member’s, live, with the content as given and a uuid of its own', () => {
    const row = newMatchingEntryRow(7, content)

    expect(row).toEqual({
      uuid: expect.stringMatching(UUID_V4),
      userId: 7,
      ...content,
      active: true,
    })
    expect(newMatchingEntryRow(7, content).uuid).not.toBe(row.uuid)
  })
})

describe('readBackMatchingEntry', () => {
  it('answers with the stored row', async () => {
    const row = stored({ uuid: 'entry-uuid', userId: 7, ...content, active: true })
    selectMock.mockResolvedValue({ success: true, value: row })

    expect(await readBackMatchingEntry('entry-uuid')).toBe(row)
    expect(selectMock).toHaveBeenCalledWith('entry-uuid')
  })

  it('throws where the row is not there: it was written a moment ago', async () => {
    selectMock.mockResolvedValue({ success: false, error: new Error('not found') })

    await expect(readBackMatchingEntry('entry-uuid')).rejects.toThrow(
      'MatchingEntry vanished right after it was written',
    )
  })
})

describe('createMatchingEntryFor', () => {
  it('stores a live entry of the member’s under a new uuid', async () => {
    await createMatchingEntryFor(bibi, content)

    expect(insertMock).toHaveBeenCalledTimes(1)
    // Over the pool, as the member's "save" always did: no transaction is handed in.
    expect(insertMock.mock.calls[0]).toEqual([
      { uuid: expect.stringMatching(UUID_V4), userId: 7, ...content, active: true },
    ])
  })

  it('stores what it is given: every kind, with or without details, near or from afar', async () => {
    const interest = {
      matchingType: 'interest',
      summary: 'Kongress X',
      details: null,
      remote: true,
    }
    await createMatchingEntryFor(bibi, interest)

    expect(storedRow()).toMatchObject({ ...interest, userId: 7, active: true })
  })

  // `created_at` and `updated_at` belong to the database: the answer and the GMS get the row
  // as it is stored, not one assembled from the input.
  it('answers with the row read back, and hands that row to the GMS with the member', async () => {
    const entry = await createMatchingEntryFor(bibi, content)

    expect(selectMock).toHaveBeenCalledWith(storedRow().uuid)
    expect(entry).toEqual(stored(storedRow()))
    expect(syncMock).toHaveBeenCalledTimes(1)
    expect(syncMock.mock.calls[0][0]).toBe(bibi)
    expect(syncMock.mock.calls[0][1]).toBe(entry)
  })

  it('tells the keying run once the GMS has the entry', async () => {
    await createMatchingEntryFor(bibi, content)

    expect(nudgeMock).toHaveBeenCalledTimes(1)
    expect(nudgeMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      syncMock.mock.invocationCallOrder[0],
    )
    expect(syncMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      selectMock.mock.invocationCallOrder[0],
    )
    expect(selectMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      insertMock.mock.invocationCallOrder[0],
    )
  })

  // The member's "save" waits for the GMS, as it always did: the answer comes once the GMS
  // has answered.
  it('waits for the GMS before it answers', async () => {
    let gmsAnswers: () => void = () => undefined
    syncMock.mockReturnValue(
      new Promise<void>((resolve) => {
        gmsAnswers = resolve
      }),
    )
    let answered = false

    const made = createMatchingEntryFor(bibi, content).then(() => {
      answered = true
    })
    await new Promise((resolve) => setImmediate(resolve))

    expect(syncMock).toHaveBeenCalledTimes(1)
    expect(answered).toBe(false)
    expect(nudgeMock).not.toHaveBeenCalled()

    gmsAnswers()
    await made

    expect(answered).toBe(true)
    expect(nudgeMock).toHaveBeenCalledTimes(1)
  })

  it('tells nobody of an entry that could not be stored', async () => {
    insertMock.mockResolvedValue({ success: false, error: new Error('insert failed') })

    await expect(createMatchingEntryFor(bibi, content)).rejects.toThrow(
      'Could not store MatchingEntry',
    )
    expect(selectMock).not.toHaveBeenCalled()
    expect(syncMock).not.toHaveBeenCalled()
    expect(nudgeMock).not.toHaveBeenCalled()
  })

  it('tells nobody of an entry that cannot be read back', async () => {
    selectMock.mockResolvedValue({ success: false, error: new Error('not found') })

    await expect(createMatchingEntryFor(bibi, content)).rejects.toThrow(
      'MatchingEntry vanished right after it was written',
    )
    expect(syncMock).not.toHaveBeenCalled()
    expect(nudgeMock).not.toHaveBeenCalled()
  })

  it('gives each entry a uuid of its own', async () => {
    await createMatchingEntryFor(bibi, content)
    await createMatchingEntryFor(bibi, content)

    const [first, second] = insertMock.mock.calls.map(([row]) => row.uuid)
    expect(first).toMatch(UUID_V4)
    expect(second).toMatch(UUID_V4)
    expect(second).not.toBe(first)
  })
})
