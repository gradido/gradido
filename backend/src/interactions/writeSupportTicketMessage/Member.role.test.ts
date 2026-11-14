// AI-GENERATED — not an architecture reference
// A unit test that runs under jest and bun alike (AGENTS.md); the queries it hands on to are
// tested against the database in `database`.
import type { DrizzleTransaction } from 'database'

const mockDatabase = {
  dbCountSupportTicketDialogOfOwner: jest.fn(),
  dbLockUserRowDrizzle: jest.fn(),
  dbUpdateSupportTicketOfOwner: jest.fn(),
  SupportTicketMessageType: { DIALOG: 'DIALOG' },
  SupportTicketStatus: { OPEN: 'OPEN' },
}

jest.mock('database', () => mockDatabase)

type RoleModule = typeof import('./Member.role')
let memberWriter: RoleModule['memberWriter']

const TX = { isTransaction: true } as unknown as DrizzleTransaction
const MEMBER = { id: 7 }

beforeAll(async () => {
  ;({ memberWriter } = await import('./Member.role'))
})

beforeEach(() => {
  jest.resetAllMocks()
})

describe('memberWriter', () => {
  it('writes as the member, a DIALOG message and no note', () => {
    expect(memberWriter(MEMBER)).toMatchObject({ userId: 7, isModerator: false, type: 'DIALOG' })
  })

  it('holds its own row: the row of the owner of every request it writes into', async () => {
    await memberWriter(MEMBER).lock(42, TX)
    expect(mockDatabase.dbLockUserRowDrizzle).toHaveBeenCalledWith(7, TX)
  })

  it('counts the dialog of a request of the member own only, as the member reads it', async () => {
    mockDatabase.dbCountSupportTicketDialogOfOwner.mockResolvedValue(4)
    await expect(memberWriter(MEMBER).countMessages(42, TX)).resolves.toBe(4)
    expect(mockDatabase.dbCountSupportTicketDialogOfOwner).toHaveBeenCalledWith(42, 7, TX)
  })

  it('opens the member own request again, from open, a question back or closed, forgets who closed it and takes a resubmission away', async () => {
    mockDatabase.dbUpdateSupportTicketOfOwner.mockResolvedValue(true)
    await expect(memberWriter(MEMBER).moveRequest(42, TX)).resolves.toBe(true)
    expect(mockDatabase.dbUpdateSupportTicketOfOwner).toHaveBeenCalledWith(
      { id: 42, userId: 7, statusIn: ['OPEN', 'IN_PROGRESS', 'CLOSED'] },
      { status: 'OPEN', closedAt: null, closedBy: null, resubmissionAt: null },
      TX,
    )
  })

  it('answers what the write answers: false where the request is not open to the member', async () => {
    mockDatabase.dbUpdateSupportTicketOfOwner.mockResolvedValue(false)
    await expect(memberWriter(MEMBER).moveRequest(42, TX)).resolves.toBe(false)
  })
})
