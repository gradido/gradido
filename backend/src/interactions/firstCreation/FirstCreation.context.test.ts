// AI-GENERATED — not an architecture reference
// Unit tests: the healing of a first creation whose process died after its bundle was booked --
// a status read of a member left in SUBMITTED whose contributions are all confirmed. Everything
// the context calls is replaced; the same flow against the database is in
// FirstCreationResolver.test.ts. Written to run under jest and `bun test --isolate` alike (see
// validateCommunities.test.ts).
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
// The values of the enum the context reads, as the enum spells them.
const mockFirstCreationStatus = {
  HAS_CREATED: 'HAS_CREATED',
  FORCED: 'FORCED',
  FORCED_UNBOOKED: 'FORCED_UNBOOKED',
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
  FirstCreationStatus: mockFirstCreationStatus,
  dbFindLatestEventForAffectedUser: jest.fn(),
  dbFindReferrerAlias: jest.fn(),
  dbGetFirstCreationSignerUserId: jest.fn(),
  dbInsertEvent: jest.fn(),
  dbSelectFirstCreationEntriesByUserId: jest.fn(),
  dbSelectFirstCreationMessage: jest.fn(),
  dbUnmarkFirstCreationContributions: jest.fn(),
  dbUpdateUserFirstCreationStatus: jest.fn(),
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

const SIGNER_ID = 7
const STALE = new Date(Date.now() - 6 * 60 * 1000)
// The member, as the request loaded them: a process left in SUBMITTED.
const member = () =>
  ({
    id: 42,
    creationAllowed: true,
    userRole: null,
    firstCreationStatus: 'SUBMITTED',
  }) as unknown as DbUser
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
  // The member's bundle: three contributions, all confirmed by the signer before the process
  // died -- in another order than confirmed, so that "the last" has to be found.
  mockDatabase.dbSelectFirstCreationEntriesByUserId.mockResolvedValue(
    [103, 101, 102].map(confirmed),
  )
  mockDatabase.dbUpdateUserFirstCreationStatus.mockResolvedValue({ success: true })
  mockDatabase.dbInsertEvent.mockResolvedValue(undefined)
  mockDatabase.dbFindLatestEventForAffectedUser.mockResolvedValue(null)
  mockDatabase.dbFindReferrerAlias.mockResolvedValue(null)
  mockDatabase.dbSelectFirstCreationMessage.mockResolvedValue('Liebe Ira, willkommen!')
  mockLoadSignerFor.mockResolvedValue({ success: true, value: { user: { id: SIGNER_ID } } })
  mockCheckEligibility.mockResolvedValue({ success: false })
})

describe('healing a first creation whose bundle was booked', () => {
  it('moves the member to DONE and writes the outcome event the process would have written', async () => {
    const view = await readFirstCreationStatus(member(), 0)

    expect(view.state).toBe('DONE')
    expect(mockDatabase.dbUpdateUserFirstCreationStatus).toHaveBeenCalledWith(
      42,
      'SUBMITTED',
      'DONE',
    )
    expect(mockDatabase.dbInsertEvent).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbInsertEvent).toHaveBeenCalledWith({
      type: 'FIRST_CREATION_DONE',
      affectedUserId: 42,
      actingUserId: SIGNER_ID,
      involvedContributionId: 103,
      // When the bundle was done -- its last confirmation -- not when the status read found it.
      createdAt: confirmedAt(103),
    })
    // The view of a thanked process: the message off the thread, the recipient to thank.
    expect(view.message).toBe('Liebe Ira, willkommen!')
    expect(mockDatabase.dbFindReferrerAlias).toHaveBeenCalledWith(42)
  })

  it('keeps the healed state when the event cannot be written', async () => {
    mockDatabase.dbInsertEvent.mockRejectedValue(new Error('events table away'))

    expect((await readFirstCreationStatus(member(), 0)).state).toBe('DONE')
  })

  it('writes no event without a signer to name, and heals all the same', async () => {
    mockLoadSignerFor.mockResolvedValue({ success: false, error: new Error('NOT_CONFIGURED') })

    expect((await readFirstCreationStatus(member(), 0)).state).toBe('DONE')
    expect(mockDatabase.dbInsertEvent).not.toHaveBeenCalled()
  })

  it('writes no event when somebody else moved the state first', async () => {
    mockDatabase.dbUpdateUserFirstCreationStatus.mockResolvedValue({ success: false })

    expect((await readFirstCreationStatus(member(), 0)).state).toBe('SUBMITTED')
    expect(mockDatabase.dbInsertEvent).not.toHaveBeenCalled()
  })

  it('leaves a process alone while somebody holds the lock', async () => {
    mockTryAcquire.mockResolvedValue(false)

    const view = await readFirstCreationStatus(member(), 0)

    expect(view.state).toBe('SUBMITTED')
    expect(mockDatabase.dbUpdateUserFirstCreationStatus).not.toHaveBeenCalled()
    // Nothing settled yet: no message, nobody to thank.
    expect(view.message).toBeNull()
    expect(mockDatabase.dbFindReferrerAlias).not.toHaveBeenCalled()
  })
})
