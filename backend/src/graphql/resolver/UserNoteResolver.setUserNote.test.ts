// AI-GENERATED — not an architecture reference
// Unit test: what setUserNote lets out when the database fails. The happy paths run against a
// database in UserNoteResolver.test.ts.
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
  dbDeleteUserNote: jest.fn(),
  dbSelectUserNote: jest.fn(),
  dbSelectUserNotesByUserId: jest.fn(),
  dbUpsertUserNote: jest.fn(),
}
const mockDatabaseErrorCode = jest.fn()
const mockResolveCommunityUuid = jest.fn()

jest.mock('@/server/LogError', () => ({ LogError: mockLogError }))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => ({ databaseErrorCode: mockDatabaseErrorCode }))
jest.mock('./util/communities', () => ({ resolveCommunityUuid: mockResolveCommunityUuid }))

const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const NOTE = 'Anna Sonnenberg, Imkerin aus Pankow'

type ResolverModule = typeof import('./UserNoteResolver')
type ContextModule = typeof import('@/server/context')
let UserNoteResolver: ResolverModule['UserNoteResolver']
let newRequestBudget: ContextModule['newRequestBudget']

beforeAll(async () => {
  ;({ UserNoteResolver } = await import('./UserNoteResolver'))
  ;({ newRequestBudget } = await import('@/server/context'))
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockResolveCommunityUuid.mockImplementation(async (uuid: string | null) => uuid ?? HOME)
  mockDatabaseErrorCode.mockReturnValue('ER_LOCK_WAIT_TIMEOUT')
})

const lenasRequest = (): Context =>
  ({
    token: null,
    setHeaders: [],
    requestBudget: newRequestBudget(),
    user: { id: 1, communityUuid: HOME, gradidoID: 'lena-id' },
  }) as unknown as Context

describe('setUserNote', () => {
  // ⛔ A failed query carries its parameters in its message, and the note is one of them. Thrown on
  // as it is, it would be written to the request log and sent back in the answer.
  it('keeps what the database throws to itself: the error names a code, never the note', async () => {
    const failed = new Error(
      `Failed query: insert into \`user_notes\` ... on duplicate key update \`note\` = ? params: 1,member,${HOME},${ANNA},${NOTE},${NOTE}`,
    )
    mockDatabase.dbUpsertUserNote.mockRejectedValue(failed)

    const refused = await new UserNoteResolver()
      .setUserNote(
        { about: { member: { gradidoID: ANNA, communityUuid: HOME } }, note: NOTE },
        lenasRequest(),
      )
      .catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(mockLogError)
    expect((refused as mockLogError).message).toBe('USER_NOTE_NOT_STORED')
    expect((refused as mockLogError).details).toEqual(['ER_LOCK_WAIT_TIMEOUT'])
    expect(mockDatabaseErrorCode).toHaveBeenCalledWith(failed)
  })

  it('keeps it to itself where taking a note away fails as well', async () => {
    const failed = new Error(`Failed query: delete ... params: 1,group,,${ANNA}`)
    mockDatabase.dbDeleteUserNote.mockRejectedValue(failed)

    const refused = await new UserNoteResolver()
      .setUserNote({ about: { groupUuid: ANNA }, note: '' }, lenasRequest())
      .catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(mockLogError)
    expect((refused as mockLogError).message).toBe('USER_NOTE_NOT_STORED')
    expect((refused as mockLogError).details).toEqual(['ER_LOCK_WAIT_TIMEOUT'])
    expect(mockDatabaseErrorCode).toHaveBeenCalledWith(failed)
  })
})
