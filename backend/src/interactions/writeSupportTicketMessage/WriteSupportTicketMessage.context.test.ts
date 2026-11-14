// AI-GENERATED — not an architecture reference
// A unit test that runs under jest and bun alike (AGENTS.md): the fakes before jest.mock, the
// module under test imported in beforeAll. The queries are tested against the database in
// `database`; the writer is a role, so the test hands in one of its own.
import { SUPPORT_TICKET_MESSAGES_MAX } from 'shared'
import type { SupportTicketWriter } from './WriteSupportTicketMessage.context'

const mockTx = { isTransaction: true }
const mockDatabase = {
  dbInsertSupportTicketMessage: jest.fn(),
  drizzleDb: () => ({ transaction: mockTransaction }),
}
const mockTransaction = jest.fn()

jest.mock('database', () => mockDatabase)

type ContextModule = typeof import('./WriteSupportTicketMessage.context')
let writeSupportTicketMessage: ContextModule['writeSupportTicketMessage']

const AT = new Date('2026-11-14T08:00:00.000Z')
let steps: string[]
let writer: SupportTicketWriter & {
  lock: jest.Mock
  countMessages: jest.Mock
  moveRequest: jest.Mock
}

beforeAll(async () => {
  ;({ writeSupportTicketMessage } = await import('./WriteSupportTicketMessage.context'))
})

beforeEach(() => {
  jest.resetAllMocks()
  steps = []
  mockTransaction.mockImplementation((work: (tx: unknown) => unknown) => work(mockTx))
  mockDatabase.dbInsertSupportTicketMessage.mockImplementation(async () => {
    steps.push('insert')
    return 77
  })
  writer = {
    userId: 3,
    isModerator: false,
    type: 'DIALOG',
    lock: jest.fn(async () => {
      steps.push('lock')
    }),
    countMessages: jest.fn(async () => {
      steps.push('count')
      return 0
    }),
    moveRequest: jest.fn(async () => {
      steps.push('move')
      return true
    }),
  }
})

describe('writeSupportTicketMessage', () => {
  it('writes the message as the writer is, and answers its id', async () => {
    await expect(writeSupportTicketMessage(writer, 42, 'Danke!', AT)).resolves.toEqual({
      success: true,
      value: 77,
    })
    expect(mockDatabase.dbInsertSupportTicketMessage).toHaveBeenCalledWith(
      {
        supportTicketId: 42,
        userId: 3,
        message: 'Danke!',
        type: 'DIALOG',
        isModerator: false,
        createdAt: AT,
      },
      mockTx,
    )
  })

  it('writes as the role is: a note of the moderation stays a note', async () => {
    writer.type = 'MODERATOR'
    writer.isModerator = true
    await writeSupportTicketMessage(writer, 42, 'intern', AT)
    expect(mockDatabase.dbInsertSupportTicketMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MODERATOR', isModerator: true }),
      mockTx,
    )
  })

  it('holds what the role holds first, before it counts and writes', async () => {
    await writeSupportTicketMessage(writer, 42, 'Danke!', AT)
    expect(writer.lock).toHaveBeenCalledWith(42, mockTx)
    expect(steps).toEqual(['lock', 'count', 'move', 'insert'])
  })

  it('refuses a full thread, with nothing written', async () => {
    writer.countMessages.mockResolvedValue(SUPPORT_TICKET_MESSAGES_MAX)
    await expect(writeSupportTicketMessage(writer, 42, 'Danke!', AT)).resolves.toEqual({
      success: false,
      error: expect.objectContaining({ code: 'SUPPORT_TICKET_MESSAGES_REACHED' }),
    })
    expect(writer.moveRequest).not.toHaveBeenCalled()
    expect(mockDatabase.dbInsertSupportTicketMessage).not.toHaveBeenCalled()
  })

  it('writes the last message a thread takes', async () => {
    writer.countMessages.mockResolvedValue(SUPPORT_TICKET_MESSAGES_MAX - 1)
    await expect(writeSupportTicketMessage(writer, 42, 'Danke!', AT)).resolves.toMatchObject({
      success: true,
    })
  })

  it('refuses a request not open to the writer, with no message written', async () => {
    writer.moveRequest.mockResolvedValue(false)
    await expect(writeSupportTicketMessage(writer, 42, 'Danke!', AT)).resolves.toEqual({
      success: false,
      error: expect.objectContaining({ code: 'SUPPORT_TICKET_NOT_FOUND' }),
    })
    expect(mockDatabase.dbInsertSupportTicketMessage).not.toHaveBeenCalled()
  })

  it('hands the transaction to the role', async () => {
    await writeSupportTicketMessage(writer, 42, 'Danke!', AT)
    expect(writer.countMessages).toHaveBeenCalledWith(42, mockTx)
    expect(writer.moveRequest).toHaveBeenCalledWith(42, mockTx)
  })
})
