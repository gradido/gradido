// AI-GENERATED — not an architecture reference
// Unit tests: the healing of a first creation whose process died after its bundle was booked --
// a status read of a stale SUBMITTED row whose contributions are all confirmed. Everything the
// context calls is replaced; the same flow against the database is in FirstCreationResolver.test.ts.
// Written to run under jest and `bun test --isolate` alike (see validateCommunities.test.ts).
import type { User as DbUser } from 'database'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
// The member's lock: free, unless a test says otherwise.
const mockTryAcquire = jest.fn()
const mockRelease = jest.fn()
class mockMutex {
  tryAcquire = mockTryAcquire
  release = mockRelease
}
// The values of the enums the context reads, as the enums spell them.
const mockFirstCreationStatus = {
  FORCED: 'FORCED',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  DONE_UNBOOKED: 'DONE_UNBOOKED',
}
const mockDatabase = {
  AppDatabase: { getInstance: () => ({ getRedisClient: () => ({}) }) },
  EventType: {
    FIRST_CREATION_DONE: 'FIRST_CREATION_DONE',
    FIRST_CREATION_SKIP: 'FIRST_CREATION_SKIP',
  },
  FirstCreationReviewReason: { PROCESS_ERROR: 'PROCESS_ERROR' },
  FirstCreationStatus: mockFirstCreationStatus,
  FirstCreationTestMode: {},
  dbFindLatestEventForAffectedUser: jest.fn(),
  dbGetFirstCreationSignerUserId: jest.fn(),
  dbInsertEvent: jest.fn(),
  dbInsertFirstCreation: jest.fn(),
  dbSelectFirstCreationByUserId: jest.fn(),
  dbSelectFirstCreationEntriesByIds: jest.fn(),
  dbUpdateFirstCreationOutcome: jest.fn(),
}
const mockLoadSignerFor = jest.fn()
const mockCheckEligibility = jest.fn()

jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('redis-semaphore', () => ({ Mutex: mockMutex }))
jest.mock('database', () => mockDatabase)
jest.mock('@/config', () => ({ CONFIG: { FUNCTION_TESTS_ENABLED: false } }))
// Nobody here may run function tests: the area of the window that asks stays out of the way.
jest.mock('@/auth/ROLES', () => ({ roleByName: () => ({ hasRight: () => false }) }))
jest.mock('@/apis/anthropic/AnthropicClient', () => ({ AnthropicClient: {} }))
jest.mock('@/apis/anthropic/crea/stub', () => ({ buildStubFirstCreationLines: jest.fn() }))
jest.mock('@/data/FirstCreation.logic', () => ({
  composeFirstCreationCheckConflictNote: jest.fn(),
  composeFirstCreationInternalNote: jest.fn(),
  composeFirstCreationMessage: jest.fn(),
  composeFirstCreationReviewMessage: jest.fn(),
  conflictingChecks: jest.fn(),
  hasFirstCreationCatalog: jest.fn(),
}))
jest.mock('./Signer.role', () => ({
  loadSignerFor: mockLoadSignerFor,
  signerComments: jest.fn(),
  signerConfirms: jest.fn(),
}))
jest.mock('./Submitter.role', () => ({
  checkEligibility: mockCheckEligibility,
  checkQuota: jest.fn(),
  countRemainingTestRuns: jest.fn(),
  fileContributions: jest.fn(),
  prepareEntries: jest.fn(),
}))

type FirstCreationContextModule = typeof import('./FirstCreation.context')
let readFirstCreationStatus: FirstCreationContextModule['readFirstCreationStatus']

beforeAll(async () => {
  readFirstCreationStatus = (await import('./FirstCreation.context')).readFirstCreationStatus
})

const MEMBER = { id: 42, creationAllowed: true, userRole: null } as unknown as DbUser
const SIGNER_ID = 7
const STALE = new Date(Date.now() - 6 * 60 * 1000)
// The member's bundle: three contributions, all confirmed by the signer before the process died.
const SUBMITTED_ROW = {
  id: 3,
  userId: 42,
  status: 'SUBMITTED',
  contributionIds: [101, 102, 103],
  message: null,
  updatedAt: STALE,
}
// Confirmed one after the other, a minute apart: the last one is the moment the bundle was done.
const confirmedAt = (id: number) => new Date(STALE.getTime() - (103 - id) * 60 * 1000)
const confirmed = (id: number) => ({
  id,
  memo: `Eintrag ${id}`,
  confirmedAt: confirmedAt(id),
  deletedAt: null,
  status: 'CONFIRMED',
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockTryAcquire.mockResolvedValue(true)
  mockRelease.mockResolvedValue(undefined)
  mockDatabase.dbSelectFirstCreationByUserId.mockResolvedValue(SUBMITTED_ROW)
  // In another order than confirmed, so that "the last" has to be found.
  mockDatabase.dbSelectFirstCreationEntriesByIds.mockResolvedValue([103, 101, 102].map(confirmed))
  mockDatabase.dbUpdateFirstCreationOutcome.mockResolvedValue({ success: true })
  mockDatabase.dbInsertEvent.mockResolvedValue(undefined)
  mockDatabase.dbFindLatestEventForAffectedUser.mockResolvedValue(null)
  mockLoadSignerFor.mockResolvedValue({ success: true, value: { user: { id: SIGNER_ID } } })
  mockCheckEligibility.mockResolvedValue({ success: false })
})

describe('healing a first creation whose bundle was booked', () => {
  it('moves the row to DONE and writes the outcome event the process would have written', async () => {
    const view = await readFirstCreationStatus(MEMBER, 0)

    expect(view.state).toBe('DONE')
    expect(mockDatabase.dbUpdateFirstCreationOutcome).toHaveBeenCalledWith(3, 'SUBMITTED', {
      status: 'DONE',
    })
    expect(mockDatabase.dbInsertEvent).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbInsertEvent).toHaveBeenCalledWith({
      type: 'FIRST_CREATION_DONE',
      affectedUserId: 42,
      actingUserId: SIGNER_ID,
      involvedContributionId: 101,
      // When the bundle was done -- its last confirmation -- not when the status read found it.
      createdAt: confirmedAt(103),
    })
  })

  it('keeps the healed row when the event cannot be written', async () => {
    mockDatabase.dbInsertEvent.mockRejectedValue(new Error('events table away'))

    expect((await readFirstCreationStatus(MEMBER, 0)).state).toBe('DONE')
  })

  it('writes no event without a signer to name, and heals all the same', async () => {
    mockLoadSignerFor.mockResolvedValue({ success: false, error: new Error('NOT_CONFIGURED') })

    expect((await readFirstCreationStatus(MEMBER, 0)).state).toBe('DONE')
    expect(mockDatabase.dbInsertEvent).not.toHaveBeenCalled()
  })

  it('writes no event when somebody else moved the row first', async () => {
    mockDatabase.dbUpdateFirstCreationOutcome.mockResolvedValue({ success: false })
    mockDatabase.dbSelectFirstCreationByUserId
      .mockResolvedValueOnce(SUBMITTED_ROW)
      .mockResolvedValueOnce({ ...SUBMITTED_ROW, status: 'DONE' })

    expect((await readFirstCreationStatus(MEMBER, 0)).state).toBe('DONE')
    expect(mockDatabase.dbInsertEvent).not.toHaveBeenCalled()
  })
})
