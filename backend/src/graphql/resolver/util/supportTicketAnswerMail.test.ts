// AI-GENERATED — not an architecture reference
// A unit test that runs under jest and bun alike (AGENTS.md): the member, the mail and the log
// are fakes before jest.mock, the module under test is imported in beforeAll. The whole way, with
// a database, is held in SupportTicketModerationResolver.test.ts.
import type { SupportTicketAnswer } from './supportTicketAnswerMail'

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const mockDatabase = { dbFindUserWithContactById: jest.fn() }
const mockCore = {
  // the real rule: a report of the transport, no null, no Error, no false
  chatMailWentOut: (result: unknown) => Boolean(result) && !(result instanceof Error),
  databaseErrorCode: (error: unknown) => (error as { code?: string }).code ?? 'UNKNOWN',
  sendAddedSupportTicketMessageEmail: jest.fn(),
}

jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => mockCore)

type MailModule = typeof import('./supportTicketAnswerMail')
let mailMemberOfSupportAnswer: MailModule['mailMemberOfSupportAnswer']

const WORDS = 'Morgens **giessen**, siehe https://gradido.net/garten'
const answer: SupportTicketAnswer = {
  supportTicketId: 42,
  ownerId: 7,
  kind: 'ANSWER',
  moderatorAlias: 'peter',
  message: WORDS,
}
const bibi = {
  id: 7,
  firstName: 'Bibi',
  lastName: 'Bloxberg',
  language: 'fr',
  emailContact: { email: 'bibi@bloxberg.de', emailChecked: true },
}

// everything the log got, as one text: it may hold the number, never the words, the address or a name
const logged = () =>
  JSON.stringify(
    [mockLogger.debug, mockLogger.info, mockLogger.warn, mockLogger.error].flatMap(
      (level) => level.mock.calls,
    ),
  )

beforeAll(async () => {
  ;({ mailMemberOfSupportAnswer } = await import('./supportTicketAnswerMail'))
})

beforeEach(() => {
  jest.resetAllMocks()
  mockDatabase.dbFindUserWithContactById.mockResolvedValue(bibi)
  mockCore.sendAddedSupportTicketMessageEmail.mockResolvedValue({ messageId: 'sent' })
})

describe('mailMemberOfSupportAnswer', () => {
  it('mails the member who owns the request, in their language, with the number and the answer', async () => {
    await expect(mailMemberOfSupportAnswer(answer)).resolves.toBe('MAIL')
    expect(mockDatabase.dbFindUserWithContactById).toHaveBeenCalledWith(7)
    expect(mockCore.sendAddedSupportTicketMessageEmail).toHaveBeenCalledWith({
      firstName: 'Bibi',
      lastName: 'Bloxberg',
      email: 'bibi@bloxberg.de',
      language: 'fr',
      moderatorAlias: 'peter',
      supportTicketNumber: 42,
      message: WORDS,
      closed: false,
    })
  })

  it('says in the mail that an answer closed the request', async () => {
    await mailMemberOfSupportAnswer({ ...answer, kind: 'ANSWER_AND_CLOSE' })
    expect(mockCore.sendAddedSupportTicketMessageEmail).toHaveBeenCalledWith(
      expect.objectContaining({ closed: true }),
    )
  })

  it('mails nothing for a note, and reads nothing for it', async () => {
    await expect(mailMemberOfSupportAnswer({ ...answer, kind: 'NOTE' })).resolves.toBe('NOTE')
    expect(mockDatabase.dbFindUserWithContactById).not.toHaveBeenCalled()
    expect(mockCore.sendAddedSupportTicketMessageEmail).not.toHaveBeenCalled()
  })

  it('mails no address the member has not confirmed', async () => {
    mockDatabase.dbFindUserWithContactById.mockResolvedValue({
      ...bibi,
      emailContact: { ...bibi.emailContact, emailChecked: false },
    })
    await expect(mailMemberOfSupportAnswer(answer)).resolves.toBe('NOT_CONFIRMED')
    expect(mockCore.sendAddedSupportTicketMessageEmail).not.toHaveBeenCalled()
  })

  it('mails nobody where there is no member to mail: an account gone, no address in force', async () => {
    mockDatabase.dbFindUserWithContactById.mockResolvedValue(null)
    await expect(mailMemberOfSupportAnswer(answer)).resolves.toBe('NO_MEMBER')
    expect(mockCore.sendAddedSupportTicketMessageEmail).not.toHaveBeenCalled()
  })

  it('names the support where the moderator has no username', async () => {
    await mailMemberOfSupportAnswer({ ...answer, moderatorAlias: null })
    expect(mockCore.sendAddedSupportTicketMessageEmail).toHaveBeenCalledWith(
      expect.objectContaining({ moderatorAlias: null }),
    )
  })

  it.each([
    ['mail switched off', null],
    ['the transport refused', new Error('refused')],
    ['nothing came back', undefined],
  ])('reports a mail that did not go out (%s), and throws not', async (_case, result) => {
    mockCore.sendAddedSupportTicketMessageEmail.mockResolvedValue(result)
    await expect(mailMemberOfSupportAnswer(answer)).resolves.toBe('NOT_SENT')
  })

  it('throws not where the mail function fails, nor where the member cannot be loaded', async () => {
    mockCore.sendAddedSupportTicketMessageEmail.mockRejectedValue(new Error(`no: ${WORDS}`))
    await expect(mailMemberOfSupportAnswer(answer)).resolves.toBe('NOT_SENT')
    mockDatabase.dbFindUserWithContactById.mockRejectedValue(
      Object.assign(new Error(`select … ${WORDS}`), { code: 'ER_LOCK_WAIT_TIMEOUT' }),
    )
    await expect(mailMemberOfSupportAnswer(answer)).resolves.toBe('NOT_SENT')
    expect(mockLogger.error).toHaveBeenLastCalledWith(
      'support answer mail failed: support_ticket_id=42 (ER_LOCK_WAIT_TIMEOUT)',
    )
  })

  it('logs the number of the request and the code of an error, never the words, the address or a name', async () => {
    await mailMemberOfSupportAnswer(answer)
    mockCore.sendAddedSupportTicketMessageEmail.mockResolvedValue(null)
    await mailMemberOfSupportAnswer(answer)
    mockCore.sendAddedSupportTicketMessageEmail.mockRejectedValue(new Error(`no: ${WORDS}`))
    await mailMemberOfSupportAnswer(answer)
    expect(logged()).toContain('support_ticket_id=42')
    for (const secret of ['giessen', 'gradido.net', 'bibi@bloxberg.de', 'Bibi', 'peter']) {
      expect([secret, logged().includes(secret)]).toEqual([secret, false])
    }
  })
})
