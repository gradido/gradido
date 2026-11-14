// AI-GENERATED — not an architecture reference
// A unit test that runs under jest and bun alike (AGENTS.md); the queries it hands on to are
// tested against the database in `database`.
import type { DrizzleTransaction } from 'database'

const mockDatabase = {
  dbCountSupportTicketMessagesOfModerator: jest.fn(),
  dbLockUserRowDrizzle: jest.fn(),
  dbUpdateSupportTicketOfModerator: jest.fn(),
  SupportTicketMessageType: { DIALOG: 'DIALOG', MODERATOR: 'MODERATOR' },
  SupportTicketStatus: { IN_PROGRESS: 'IN_PROGRESS', CLOSED: 'CLOSED' },
}

jest.mock('database', () => mockDatabase)

type RoleModule = typeof import('./Moderator.role')
let moderatorWriter: RoleModule['moderatorWriter']

const TX = { isTransaction: true } as unknown as DrizzleTransaction
const AT = new Date('2026-11-14T13:00:00.000Z')
const LATER = new Date('2026-11-20T08:00:00.000Z')
const SCOPE = { tags: ['garden'], seesAllCreationGroups: false, seesUntagged: true }
// peter (9) moderates, bibi (7) owns the request
const write = { moderator: { id: 9 }, ownerId: 7, scope: SCOPE, at: AT, resubmissionAt: null }
// the request, from the states the moderation writes from, in peter's scope, not his own
const WHERE = { id: 42, statusIn: ['OPEN', 'IN_PROGRESS', 'CLOSED'], scope: SCOPE, moderatorId: 9 }
// a note that sets a resubmission: into an open request only (K4)
const WHERE_OPEN = { ...WHERE, statusIn: ['OPEN', 'IN_PROGRESS'] }

beforeAll(async () => {
  ;({ moderatorWriter } = await import('./Moderator.role'))
})

beforeEach(() => {
  jest.resetAllMocks()
})

describe('moderatorWriter', () => {
  it('writes as the moderator: an answer in the dialog, a note as the moderation own', () => {
    expect(moderatorWriter({ ...write, kind: 'ANSWER' })).toMatchObject({
      userId: 9,
      isModerator: true,
      type: 'DIALOG',
    })
    expect(moderatorWriter({ ...write, kind: 'ANSWER_AND_CLOSE' }).type).toBe('DIALOG')
    expect(moderatorWriter({ ...write, kind: 'NOTE' }).type).toBe('MODERATOR')
  })

  it('holds the row of the member who owns the request, not the moderator own', async () => {
    await moderatorWriter({ ...write, kind: 'ANSWER' }).lock(42, TX)
    expect(mockDatabase.dbLockUserRowDrizzle).toHaveBeenCalledWith(7, TX)
  })

  it('counts the messages of its own kind, on the condition of the write', async () => {
    mockDatabase.dbCountSupportTicketMessagesOfModerator.mockResolvedValue(4)
    await expect(moderatorWriter({ ...write, kind: 'ANSWER' }).countMessages(42, TX)).resolves.toBe(
      4,
    )
    expect(mockDatabase.dbCountSupportTicketMessagesOfModerator).toHaveBeenCalledWith(
      WHERE,
      'DIALOG',
      TX,
    )
    await moderatorWriter({ ...write, kind: 'NOTE' }).countMessages(42, TX)
    expect(mockDatabase.dbCountSupportTicketMessagesOfModerator).toHaveBeenLastCalledWith(
      WHERE,
      'MODERATOR',
      TX,
    )
  })

  it('makes an answer a question back to the member, forgets who closed it, and sets the resubmission as the box stands', async () => {
    mockDatabase.dbUpdateSupportTicketOfModerator.mockResolvedValue(true)
    await expect(moderatorWriter({ ...write, kind: 'ANSWER' }).moveRequest(42, TX)).resolves.toBe(
      true,
    )
    expect(mockDatabase.dbUpdateSupportTicketOfModerator).toHaveBeenCalledWith(
      WHERE,
      { status: 'IN_PROGRESS', closedAt: null, closedBy: null, resubmissionAt: null },
      TX,
    )
    await moderatorWriter({ ...write, kind: 'ANSWER', resubmissionAt: LATER }).moveRequest(42, TX)
    expect(mockDatabase.dbUpdateSupportTicketOfModerator).toHaveBeenLastCalledWith(
      WHERE,
      { status: 'IN_PROGRESS', closedAt: null, closedBy: null, resubmissionAt: LATER },
      TX,
    )
  })

  it('closes with the answer at its moment, by the moderator, and takes a resubmission away', async () => {
    mockDatabase.dbUpdateSupportTicketOfModerator.mockResolvedValue(true)
    await moderatorWriter({ ...write, kind: 'ANSWER_AND_CLOSE' }).moveRequest(42, TX)
    expect(mockDatabase.dbUpdateSupportTicketOfModerator).toHaveBeenCalledWith(
      WHERE,
      { status: 'CLOSED', closedAt: AT, closedBy: 9, resubmissionAt: null },
      TX,
    )
  })

  it('sets with a note the resubmission and no state, on the same condition as its count', async () => {
    mockDatabase.dbUpdateSupportTicketOfModerator.mockResolvedValue(true)
    await expect(moderatorWriter({ ...write, kind: 'NOTE' }).moveRequest(42, TX)).resolves.toBe(
      true,
    )
    expect(mockDatabase.dbUpdateSupportTicketOfModerator).toHaveBeenCalledWith(
      WHERE,
      { resubmissionAt: null },
      TX,
    )
  })

  it('writes a note with a resubmission into an open request only, its count on the same condition', async () => {
    mockDatabase.dbUpdateSupportTicketOfModerator.mockResolvedValue(true)
    const writer = moderatorWriter({ ...write, kind: 'NOTE', resubmissionAt: LATER })
    await writer.countMessages(42, TX)
    await writer.moveRequest(42, TX)
    expect(mockDatabase.dbCountSupportTicketMessagesOfModerator).toHaveBeenCalledWith(
      WHERE_OPEN,
      'MODERATOR',
      TX,
    )
    expect(mockDatabase.dbUpdateSupportTicketOfModerator).toHaveBeenCalledWith(
      WHERE_OPEN,
      { resubmissionAt: LATER },
      TX,
    )
    // an answer with one reopens a closed request as a question back
    await moderatorWriter({ ...write, kind: 'ANSWER', resubmissionAt: LATER }).moveRequest(42, TX)
    expect(mockDatabase.dbUpdateSupportTicketOfModerator).toHaveBeenLastCalledWith(
      WHERE,
      expect.objectContaining({ status: 'IN_PROGRESS' }),
      TX,
    )
  })

  it('answers what the write answers: false where the request is not the moderator one to act on', async () => {
    mockDatabase.dbUpdateSupportTicketOfModerator.mockResolvedValue(false)
    await expect(moderatorWriter({ ...write, kind: 'ANSWER' }).moveRequest(42, TX)).resolves.toBe(
      false,
    )
    await expect(moderatorWriter({ ...write, kind: 'NOTE' }).moveRequest(42, TX)).resolves.toBe(
      false,
    )
  })
})
