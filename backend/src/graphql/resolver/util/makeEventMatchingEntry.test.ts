// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import {
  User as DbUser,
  dbFindUsersWithEmailContactByIds,
  dbHasEventMatchingEntry,
  dbInsertMatchingEntry,
  dbSelectMatchingEntriesByUserId,
  dbSelectMatchingEntryByUuid,
  dbTakeEventMatchingEntry,
  drizzleDb,
  EventMatchingEntrySelect,
  MatchingEntryInsert,
  MatchingEntrySelect,
} from 'database'
import { matchingKeyingRun } from '@/apis/anthropic/matching/keyingRun'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { makeEventMatchingEntry } from './makeEventMatchingEntry'
import { syncMatchingEntryToGms } from './syncMatchingEntryToGms'

/**
 * The entry an event link noted, made when the address is confirmed -- without a database: the
 * transaction is a stand-in that runs its callback and says how it ended, and the statements
 * are answered here. That the note and the entry go together in the database is held by
 * `eventMatchingEntries.test.ts`; that the three confirmations call this, by the resolvers'
 * own tests.
 */
jest.mock('database', () => ({
  __esModule: true,
  ...jest.requireActual('database'),
  dbFindUsersWithEmailContactByIds: jest.fn(),
  dbHasEventMatchingEntry: jest.fn(),
  dbInsertMatchingEntry: jest.fn(),
  dbSelectMatchingEntriesByUserId: jest.fn(),
  dbSelectMatchingEntryByUuid: jest.fn(),
  dbTakeEventMatchingEntry: jest.fn(),
  drizzleDb: jest.fn(),
}))
jest.mock('./syncMatchingEntryToGms', () => ({ syncMatchingEntryToGms: jest.fn() }))
jest.mock('@/apis/anthropic/matching/keyingRun', () => ({
  matchingKeyingRun: { nudge: jest.fn() },
}))

const hasMock = dbHasEventMatchingEntry as jest.Mock
const takeMock = dbTakeEventMatchingEntry as jest.Mock
const ownMock = dbSelectMatchingEntriesByUserId as jest.Mock
const insertMock = dbInsertMatchingEntry as jest.Mock
const selectMock = dbSelectMatchingEntryByUuid as jest.Mock
const usersMock = dbFindUsersWithEmailContactByIds as jest.Mock
const syncMock = syncMatchingEntryToGms as jest.Mock
const nudgeMock = matchingKeyingRun.nudge as jest.Mock
const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.makeEventMatchingEntry`,
)

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const MAREN = 17
// A member who takes part in the matching: the GMS is asked about her entries.
const maren = { id: MAREN, gradidoID: 'marens-gradido-id', gmsAllowed: true } as unknown as DbUser
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** The entry that waits at an account, as the registration noted it. */
const noted = (changed: Partial<EventMatchingEntrySelect> = {}): EventMatchingEntrySelect => ({
  id: 5,
  userId: MAREN,
  summary: 'Kongress Frequency Healing',
  details: 'Selbstheilung, Biohacking',
  remote: true,
  // Noted an hour ago: by the clock of the run, so that the case does not age with the calendar.
  createdAt: new Date(Date.now() - HOUR_MS),
  ...changed,
})

/** One of the member's own entries, as the list of her entries holds it. */
const own = (changed: Partial<MatchingEntrySelect> = {}): MatchingEntrySelect =>
  ({
    id: 9,
    uuid: 'own-entry-uuid',
    userId: MAREN,
    matchingType: 'interest',
    summary: 'Kongress Frequency Healing',
    details: null,
    remote: false,
    active: true,
    ...changed,
  }) as unknown as MatchingEntrySelect

const stored = (row: MatchingEntryInsert): MatchingEntrySelect =>
  ({
    id: 3,
    ...row,
    createdAt: new Date('2026-10-13T18:00:00.000Z'),
    updatedAt: new Date('2026-10-13T18:00:00.000Z'),
  }) as unknown as MatchingEntrySelect

const storedRow = (): MatchingEntryInsert => insertMock.mock.calls[0][0]

// The transaction: it hands its callback this stand-in, and notes how each one ended -- where
// the callback throws, so does the transaction, which is where the database rolls back.
const tx = { the: 'transaction' }
let transactions: Array<'committed' | 'rolled back'>

/** A failed statement as Drizzle reports it: the parameters stand in the message. */
const failedQuery = (code: string) =>
  Object.assign(
    new Error(
      'Failed query: insert into `matching_entries` … params: Kongress Frequency Healing,Selbstheilung, Biohacking',
    ),
    { cause: Object.assign(new Error('driver'), { code }) },
  )

/** Everything the logger was told, as one text. */
const everythingLogged = (): string =>
  JSON.stringify(
    (['info', 'warn', 'error', 'debug'] as const).flatMap(
      (level) => (logger[level] as jest.Mock).mock.calls,
    ),
  )

// What makeEventMatchingEntry started without waiting for has settled once the queue is empty.
const settled = () => new Promise((resolve) => setImmediate(resolve))

// A database where an entry waits for Maren, every write succeeds, and a read answers with
// what was written.
beforeEach(() => {
  jest.clearAllMocks()
  transactions = []
  ;(drizzleDb as jest.Mock).mockReturnValue({
    transaction: async (callback: (t: typeof tx) => Promise<unknown>) => {
      try {
        const answer = await callback(tx)
        transactions.push('committed')
        return answer
      } catch (error) {
        transactions.push('rolled back')
        throw error
      }
    },
  })
  hasMock.mockResolvedValue(true)
  takeMock.mockResolvedValue(noted())
  ownMock.mockResolvedValue([])
  insertMock.mockResolvedValue({ success: true })
  selectMock.mockImplementation(async () => ({ success: true, value: stored(storedRow()) }))
  usersMock.mockResolvedValue([maren])
  syncMock.mockResolvedValue(undefined)
})

describe('makeEventMatchingEntry', () => {
  describe('for an account nothing is noted at', () => {
    beforeEach(() => {
      hasMock.mockResolvedValue(false)
    })

    // Nearly every confirmation: one read, and no transaction at all.
    it('asks once whether a note waits, and does nothing else', async () => {
      await makeEventMatchingEntry(MAREN)

      expect(hasMock).toHaveBeenCalledTimes(1)
      expect(hasMock).toHaveBeenCalledWith(MAREN)
      expect(drizzleDb).not.toHaveBeenCalled()
      expect(transactions).toEqual([])
      expect(takeMock).not.toHaveBeenCalled()
      expect(insertMock).not.toHaveBeenCalled()
      expect(usersMock).not.toHaveBeenCalled()
      expect(selectMock).not.toHaveBeenCalled()
      expect(syncMock).not.toHaveBeenCalled()
      expect(nudgeMock).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
      expect(logger.warn).not.toHaveBeenCalled()
    })
  })

  // Two confirmations at the same moment: the other one took the note between the question and
  // the transaction.
  it('makes nothing where the note was taken by the time the transaction holds the row', async () => {
    takeMock.mockResolvedValue(undefined)

    await makeEventMatchingEntry(MAREN)

    expect(transactions).toEqual(['committed'])
    expect(insertMock).not.toHaveBeenCalled()
    expect(ownMock).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  describe('for an account an event link noted an entry at', () => {
    it('makes an interest of it, live, with the words and the reach the link gave', async () => {
      await makeEventMatchingEntry(MAREN)

      expect(insertMock).toHaveBeenCalledTimes(1)
      expect(storedRow()).toEqual({
        uuid: expect.stringMatching(UUID_V4),
        userId: MAREN,
        matchingType: 'interest',
        summary: 'Kongress Frequency Healing',
        details: 'Selbstheilung, Biohacking',
        remote: true,
        active: true,
      })
    })

    it('keeps an entry that is only found where the member lives, and one without details', async () => {
      takeMock.mockResolvedValue(
        noted({ summary: 'Training Rücken', details: null, remote: false }),
      )

      await makeEventMatchingEntry(MAREN)

      expect(storedRow()).toMatchObject({
        matchingType: 'interest',
        summary: 'Training Rücken',
        details: null,
        remote: false,
        active: true,
      })
    })

    // ⛔ What "once" rests on: the note is taken and the entry written in ONE transaction.
    it('takes the note and writes the entry in the same transaction', async () => {
      await makeEventMatchingEntry(MAREN)

      expect(takeMock).toHaveBeenCalledWith(MAREN, tx)
      expect(insertMock).toHaveBeenCalledWith(storedRow(), tx)
      expect(transactions).toEqual(['committed'])
      expect(insertMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        takeMock.mock.invocationCallOrder[0],
      )
    })

    it('hands the stored entry to the GMS with the member, and tells the keying run', async () => {
      await makeEventMatchingEntry(MAREN)

      expect(usersMock).toHaveBeenCalledWith([MAREN])
      expect(selectMock).toHaveBeenCalledWith(storedRow().uuid)
      expect(syncMock).toHaveBeenCalledTimes(1)
      expect(syncMock.mock.calls[0][0]).toBe(maren)
      expect(syncMock.mock.calls[0][1]).toEqual(stored(storedRow()))
      expect(nudgeMock).toHaveBeenCalledTimes(1)
    })

    // Nothing leaves for the GMS while the entry could still be taken back.
    it('tells the GMS only once the transaction went through', async () => {
      let committedWhenTheGmsWasAsked: boolean | undefined
      syncMock.mockImplementation(async () => {
        committedWhenTheGmsWasAsked = transactions.includes('committed')
      })

      await makeEventMatchingEntry(MAREN)

      expect(committedWhenTheGmsWasAsked).toBe(true)
    })

    it('says in the log that it made the entry, by its uuid and without its words', async () => {
      await makeEventMatchingEntry(MAREN)

      expect(logger.info).toHaveBeenCalledWith(
        `made the entry an event link noted for user ${MAREN}: ${storedRow().uuid}`,
      )
      expect(everythingLogged()).not.toContain('Kongress')
      expect(everythingLogged()).not.toContain('Selbstheilung')
    })

    /**
     * ⛔ The confirmation does not wait for the GMS: somebody presses "set password", and an
     * event sends many of them within the same hour. A GMS that does not answer keeps nobody.
     */
    // A fresh account does not take part: the GMS holds nothing of it, and a new entry is
    // nothing it could hold. The entry reaches the GMS once the member takes part.
    it('asks the GMS nothing for a member who does not take part, and tells the keying run', async () => {
      usersMock.mockResolvedValue([{ ...maren, gmsAllowed: false }])

      await makeEventMatchingEntry(MAREN)

      expect(insertMock).toHaveBeenCalledTimes(1)
      expect(selectMock).not.toHaveBeenCalled()
      expect(syncMock).not.toHaveBeenCalled()
      expect(nudgeMock).toHaveBeenCalledTimes(1)
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('does not wait for the GMS', async () => {
      syncMock.mockReturnValue(new Promise(() => undefined))

      await makeEventMatchingEntry(MAREN)

      expect(syncMock).toHaveBeenCalledTimes(1)
      expect(nudgeMock).toHaveBeenCalledTimes(1)
    })

    it('does not fail where the GMS does, and says so without the words of the entry', async () => {
      syncMock.mockRejectedValue(failedQuery('ECONNRESET'))

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()
      await settled()

      expect(logger.warn).toHaveBeenCalledWith(
        `could not hand the entry ${storedRow().uuid} to the GMS:`,
        'ECONNRESET',
      )
      expect(logger.error).not.toHaveBeenCalled()
      expect(nudgeMock).toHaveBeenCalledTimes(1)
      expect(everythingLogged()).not.toContain('Kongress')
    })
  })

  /**
   * Thirty days: a registration is confirmed within a day as a rule. What waits longer is no
   * answer to the link any more, and must not go live years later with a new password.
   */
  describe('a note that waited long', () => {
    it('is let go and not made after thirty days', async () => {
      takeMock.mockResolvedValue(noted({ createdAt: new Date(Date.now() - 31 * DAY_MS) }))

      await makeEventMatchingEntry(MAREN)

      // Taken in a transaction that went through: the note is gone, and nothing was made.
      expect(transactions).toEqual(['committed'])
      expect(insertMock).not.toHaveBeenCalled()
      expect(syncMock).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith(
        `let go the entry an event link noted for user ${MAREN}: noted more than 30 days ago`,
      )
    })

    it('is still made after twenty-nine days', async () => {
      takeMock.mockResolvedValue(noted({ createdAt: new Date(Date.now() - 29 * DAY_MS) }))

      await makeEventMatchingEntry(MAREN)

      expect(insertMock).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * An account a member vouches for can sign in before its address is confirmed, open the link
   * again and save the entry in the form. The note then has nothing left to make: the same kind,
   * the same words whatever their case and the blanks around them -- live, or paused by the
   * member since.
   */
  describe('where the member has that entry already', () => {
    it('lets the note go and makes no second one', async () => {
      ownMock.mockResolvedValue([own({ summary: '  kongress frequency HEALING ' })])

      await makeEventMatchingEntry(MAREN)

      expect(ownMock).toHaveBeenCalledWith(MAREN, tx)
      expect(transactions).toEqual(['committed'])
      expect(insertMock).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith(
        `user ${MAREN} has the entry an event link noted already; the note is let go`,
      )
    })

    // Paused, it was taken out of the search on purpose: the link must not put it back live.
    it('lets the note go where the member has paused that entry', async () => {
      ownMock.mockResolvedValue([own({ active: false })])

      await makeEventMatchingEntry(MAREN)

      expect(insertMock).not.toHaveBeenCalled()
      expect(transactions).toEqual(['committed'])
    })

    it.each<[string, Partial<MatchingEntrySelect>]>([
      ['one of another kind', { matchingType: 'offer' }],
      ['one whose words only begin the same way', { summary: 'Kongress Frequency Healing 2027' }],
    ])('makes it where the member has only %s', async (_what, changed) => {
      ownMock.mockResolvedValue([own(changed)])

      await makeEventMatchingEntry(MAREN)

      expect(insertMock).toHaveBeenCalledTimes(1)
    })

    // Asked in the transaction that holds the note: the member's list as it stands then.
    it('reads the member’s entries after it has taken the note', async () => {
      await makeEventMatchingEntry(MAREN)

      expect(ownMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        takeMock.mock.invocationCallOrder[0],
      )
      expect(insertMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        ownMock.mock.invocationCallOrder[0],
      )
    })
  })

  /**
   * ⛔ It never throws: the address is confirmed by the time it is called, and nothing that
   * goes wrong here may be read as "the confirmation failed".
   */
  describe('where something goes wrong', () => {
    it('leaves the note waiting where the entry cannot be stored, and tells nobody', async () => {
      insertMock.mockResolvedValue({ success: false, error: new Error('insert failed') })

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      // The transaction ended by throwing: the note is back with it.
      expect(transactions).toEqual(['rolled back'])
      expect(usersMock).not.toHaveBeenCalled()
      expect(syncMock).not.toHaveBeenCalled()
      expect(nudgeMock).not.toHaveBeenCalled()
      expect(logger.info).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        `could not make the entry an event link noted for user ${MAREN}, it waits on:`,
        'Error',
      )
    })

    // Drizzle writes the parameters of a failed statement into its message: logged is the
    // driver's code.
    it('logs the driver code of a failed statement, never its message', async () => {
      insertMock.mockRejectedValue(failedQuery('ER_LOCK_WAIT_TIMEOUT'))

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(transactions).toEqual(['rolled back'])
      expect(logger.error).toHaveBeenCalledWith(
        `could not make the entry an event link noted for user ${MAREN}, it waits on:`,
        'ER_LOCK_WAIT_TIMEOUT',
      )
      expect(everythingLogged()).not.toContain('Kongress')
      expect(everythingLogged()).not.toContain('Selbstheilung')
      expect(syncMock).not.toHaveBeenCalled()
    })

    it('does not fail where the note cannot be read', async () => {
      takeMock.mockRejectedValue(failedQuery('ECONNREFUSED'))

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(insertMock).not.toHaveBeenCalled()
      expect(syncMock).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    // mysql2 says so in words only, with no code: the line names the kind.
    it('does not fail where no connection for the transaction is to be had', async () => {
      ;(drizzleDb as jest.Mock).mockReturnValue({
        transaction: async () => {
          throw new Error('Pool is closed.')
        },
      })

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(takeMock).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        `could not make the entry an event link noted for user ${MAREN}, it waits on:`,
        'Error',
      )
    })

    it('does not fail where it cannot even be asked whether a note waits', async () => {
      hasMock.mockRejectedValue(new Error('connect ECONNREFUSED'))

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(drizzleDb).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })

    // The entry is stored and stays: what failed is only the telling.
    it('keeps the stored entry where the account cannot be read afterwards', async () => {
      usersMock.mockRejectedValue(new Error('connection lost'))

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(transactions).toEqual(['committed'])
      expect(syncMock).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        `the entry ${storedRow().uuid} is stored, but could not be handed on:`,
        'Error',
      )
    })

    // A deleted account: its entry is stored, and no path publishes it.
    it('hands nothing on for an account that is gone', async () => {
      usersMock.mockResolvedValue([])

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(transactions).toEqual(['committed'])
      expect(selectMock).not.toHaveBeenCalled()
      expect(syncMock).not.toHaveBeenCalled()
      expect(nudgeMock).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        `user ${MAREN} not found, the entry ${storedRow().uuid} is not handed to the GMS`,
      )
    })

    it('does not fail where the entry cannot be read back', async () => {
      selectMock.mockResolvedValue({ success: false, error: new Error('not found') })

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(transactions).toEqual(['committed'])
      expect(syncMock).not.toHaveBeenCalled()
      // LogError has said which entry on its own; here only that it went no further.
      expect(logger.warn).toHaveBeenCalledWith(
        `the entry ${storedRow().uuid} is stored, but could not be handed on:`,
        'Error',
      )
    })

    it('does not fail where the keying run cannot be told', async () => {
      nudgeMock.mockImplementationOnce(() => {
        throw new Error('no run')
      })

      await expect(makeEventMatchingEntry(MAREN)).resolves.toBeUndefined()

      expect(transactions).toEqual(['committed'])
      expect(logger.warn).toHaveBeenCalledTimes(1)
    })
  })

  it('makes the entry of the account it is called for', async () => {
    hasMock.mockImplementation(async (userId: number) => userId === 23)
    takeMock.mockImplementation(async (userId: number) =>
      userId === 23 ? noted({ userId: 23, summary: 'Kongress B' }) : undefined,
    )
    usersMock.mockResolvedValue([{ id: 23 } as DbUser])

    await makeEventMatchingEntry(MAREN)
    expect(insertMock).not.toHaveBeenCalled()

    await makeEventMatchingEntry(23)
    expect(storedRow()).toMatchObject({ userId: 23, summary: 'Kongress B' })
    expect(usersMock).toHaveBeenCalledWith([23])
  })
})
