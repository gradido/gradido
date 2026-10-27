// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { User as DbUser, dbUpsertUserNote } from 'database'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Context, newRequestBudget } from '@/server/context'
import { UserNoteResolver } from './UserNoteResolver'

// What the database answers is mocked here: the subject is what the resolver lets out when the
// database fails. The happy paths run against a database in UserNoteResolver.test.ts.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbUpsertUserNote: jest.fn(),
    dbDeleteUserNote: jest.fn(),
    getHomeCommunity: jest.fn(async () => ({ communityUuid: HOME, name: 'Gradido Akademie' })),
  }
})

const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const NOTE = 'Anna Sonnenberg, Imkerin aus Pankow'

const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: { id: 1, communityUuid: HOME, gradidoID: 'lena-id' } as unknown as DbUser,
})

describe('setUserNote', () => {
  // ⛔ A failed query carries its parameters in its message, and the note is one of them. Thrown on
  // as it is, it would be written to the request log and sent back in the answer.
  it('keeps what the database throws to itself: the error names a code, never the note', async () => {
    ;(dbUpsertUserNote as jest.Mock).mockRejectedValue(
      Object.assign(
        new Error(
          `Failed query: insert into \`user_notes\` ... on duplicate key update \`note\` = ? params: 1,member,${HOME},${ANNA},${NOTE},${NOTE}`,
        ),
        { cause: { code: 'ER_LOCK_WAIT_TIMEOUT' } },
      ),
    )
    const errors = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

    const refused = await new UserNoteResolver()
      .setUserNote(
        { about: { member: { gradidoID: ANNA, communityUuid: HOME } }, note: NOTE },
        lenasRequest(),
      )
      .catch((error: Error) => error)

    expect(refused).toBeInstanceOf(Error)
    expect((refused as Error).message).toBe('USER_NOTE_NOT_STORED')
    const logged = JSON.stringify((errors.error as jest.Mock).mock.calls)
    expect(logged).toContain('ER_LOCK_WAIT_TIMEOUT')
    expect(logged).not.toContain('Sonnenberg')
    expect(logged).not.toContain('Failed query')
  })
})
