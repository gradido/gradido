// AI-GENERATED — not an architecture reference
// A unit test that runs under jest and bun alike (AGENTS.md): the fakes before jest.mock, the
// module under test imported in beforeAll.
import type { LogError } from '@/server/LogError'

const mockLogger = { error: jest.fn() }
const mockDatabaseErrorCode = jest.fn()

jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('core', () => ({ databaseErrorCode: mockDatabaseErrorCode }))

type FromDatabaseModule = typeof import('./fromDatabase')
let fromDatabase: FromDatabaseModule['fromDatabase']

// What a failed insert says of itself: the statement and the values it carried.
const WORDS = 'Mein Passwort-Link kommt nicht an, meine Tochter heisst Ramona'
const failedInsert = new Error(`Duplicate entry for key PRIMARY, values ('${WORDS}')`)

beforeAll(async () => {
  ;({ fromDatabase } = await import('./fromDatabase'))
})

beforeEach(() => {
  jest.resetAllMocks()
})

describe('fromDatabase', () => {
  it('answers what the work answers', async () => {
    await expect(fromDatabase('NOT_STORED', () => Promise.resolve(42))).resolves.toBe(42)
  })

  it('throws the code where the database fails, and nothing of what the error said', async () => {
    mockDatabaseErrorCode.mockReturnValue('ER_DUP_ENTRY')
    const thrown = await fromDatabase('NOT_STORED', () => Promise.reject(failedInsert)).catch(
      (error: LogError) => error,
    )
    expect((thrown as LogError).message).toBe('NOT_STORED')
    expect(mockDatabaseErrorCode).toHaveBeenCalledWith(failedInsert)
    expect(mockLogger.error).toHaveBeenCalledWith('NOT_STORED', 'ER_DUP_ENTRY')
    expect(JSON.stringify(mockLogger.error.mock.calls)).not.toContain('Ramona')
  })
})
