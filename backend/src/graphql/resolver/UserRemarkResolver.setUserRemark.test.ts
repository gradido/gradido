// AI-GENERATED — not an architecture reference
// Unit test: what setUserRemark lets out when the database fails, and what it answers when it does
// not. Who may read and write runs against a database in UserRemarkResolver.test.ts.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike, as AGENTS.md asks and
// validateCommunities.test.ts shows: the fakes are declared before `jest.mock`, each factory hands
// out its own fakes (bun has no `jest.requireActual`), and the module under test is imported in
// `beforeAll`, after every mock is registered. LogError is one of the fakes: what the resolver
// hands it is the resolver's decision, what LogError writes is LogError's.
import type { Context } from '@/server/context'

/** Stands in for LogError and keeps what it was handed: that is what would reach the log. */
class mockLogError extends Error {
  readonly details: unknown[]
  constructor(message: string, ...details: unknown[]) {
    super(message)
    this.details = details
  }
}
const mockDatabase = {
  dbDeleteUserRemark: jest.fn(),
  dbSelectUserRemark: jest.fn(),
  dbUpsertUserRemark: jest.fn(),
  remarkEditorName: jest.fn(),
}
const mockDatabaseErrorCode = jest.fn()

jest.mock('@/server/LogError', () => ({ LogError: mockLogError }))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => ({ databaseErrorCode: mockDatabaseErrorCode }))

const LEONI = 101
const REMARK = 'Bürgermeisterin von Lieblingsstadt'

type ResolverModule = typeof import('./UserRemarkResolver')
type ContextModule = typeof import('@/server/context')
let UserRemarkResolver: ResolverModule['UserRemarkResolver']
let newRequestBudget: ContextModule['newRequestBudget']

beforeAll(async () => {
  ;({ UserRemarkResolver } = await import('./UserRemarkResolver'))
  ;({ newRequestBudget } = await import('@/server/context'))
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockDatabaseErrorCode.mockReturnValue('ER_LOCK_WAIT_TIMEOUT')
  mockDatabase.remarkEditorName.mockImplementation((first: string, last: string) =>
    `${first} ${last}`.trim(),
  )
})

const bibisRequest = (): Context =>
  ({
    token: null,
    setHeaders: [],
    requestBudget: newRequestBudget(),
    user: { id: 7, firstName: 'Bibi', lastName: 'Bloxberg' },
  }) as unknown as Context

describe('setUserRemark', () => {
  it('writes the words by the signed-in moderator, and answers them with the time it wrote', async () => {
    const answer = await new UserRemarkResolver().setUserRemark(
      { userId: LEONI, remark: REMARK },
      bibisRequest(),
    )

    expect(mockDatabase.dbUpsertUserRemark).toHaveBeenCalledTimes(1)
    const [userId, remark, updatedBy, updatedAt] = mockDatabase.dbUpsertUserRemark.mock.calls[0]
    expect({ userId, remark, updatedBy }).toEqual({ userId: LEONI, remark: REMARK, updatedBy: 7 })
    // The time it answers is the time it wrote, not a second clock reading.
    expect(answer).toEqual({ remark: REMARK, updatedAt, updatedByName: 'Bibi Bloxberg' })
    expect(mockDatabase.dbDeleteUserRemark).not.toHaveBeenCalled()
  })

  it('takes an emptied remark away and answers null', async () => {
    const answer = await new UserRemarkResolver().setUserRemark(
      { userId: LEONI, remark: ' \n ' },
      bibisRequest(),
    )
    expect(answer).toBeNull()
    expect(mockDatabase.dbDeleteUserRemark).toHaveBeenCalledWith(LEONI)
    expect(mockDatabase.dbUpsertUserRemark).not.toHaveBeenCalled()
  })

  // ⛔ A failed query carries its parameters in its message, and the remark is one of them. Thrown
  // on as it is, it would be written to the request log and sent back in the answer.
  it('keeps what the database throws to itself: the error names a code, never the remark', async () => {
    const failed = new Error(
      `Failed query: insert into \`user_remarks\` ... on duplicate key update \`remark\` = ? params: ${LEONI},${REMARK},7`,
    )
    mockDatabase.dbUpsertUserRemark.mockRejectedValue(failed)

    const refused = await new UserRemarkResolver()
      .setUserRemark({ userId: LEONI, remark: REMARK }, bibisRequest())
      .catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(mockLogError)
    expect((refused as mockLogError).message).toBe('USER_REMARK_NOT_STORED')
    expect((refused as mockLogError).details).toEqual(['ER_LOCK_WAIT_TIMEOUT'])
    expect(mockDatabaseErrorCode).toHaveBeenCalledWith(failed)
  })

  it('keeps it to itself where taking a remark away fails as well', async () => {
    const failed = new Error(`Failed query: delete from \`user_remarks\` ... params: ${LEONI}`)
    mockDatabase.dbDeleteUserRemark.mockRejectedValue(failed)

    const refused = await new UserRemarkResolver()
      .setUserRemark({ userId: LEONI, remark: '' }, bibisRequest())
      .catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(mockLogError)
    expect((refused as mockLogError).message).toBe('USER_REMARK_NOT_STORED')
    expect((refused as mockLogError).details).toEqual(['ER_LOCK_WAIT_TIMEOUT'])
  })
})
