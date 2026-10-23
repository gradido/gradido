// AI-GENERATED — not an architecture reference
// Unit tests: the lines under the names on "Kontakte & Chat" (E-083), with the queries replaced.
// The queries themselves are tested against the database in `database`.
//
// Written to run under jest and `bun test --isolate` alike (AGENTS.md): the factories hand out
// their own fakes, declared before `jest.mock`, and the module is imported in `beforeAll`.
import { GradidoUnit } from 'shared'

const mockDatabase = {
  TransactionTypeId: { SEND: 2, RECEIVE: 3 },
  dbSelectChatMessagesByIds: jest.fn(),
  dbSelectChatMessageImageInfos: jest.fn(),
  dbSelectBookingLinesOfUser: jest.fn(),
}
const mockChatMemberUsers = jest.fn()

jest.mock('database', () => mockDatabase)
jest.mock('./chatMemberUsers', () => ({
  chatMemberUsers: mockChatMemberUsers,
  chatMemberKey: (member: { communityUuid: string; gradidoId: string }) =>
    `${member.communityUuid.toLowerCase()}/${member.gradidoId.toLowerCase()}`,
}))

type ChatPreviewsModule = typeof import('./chatPreviews')
let chatMessagePreviews: ChatPreviewsModule['chatMessagePreviews']
let bookingPreviews: ChatPreviewsModule['bookingPreviews']
let contactChatPreviews: ChatPreviewsModule['contactChatPreviews']

beforeAll(async () => {
  const module = await import('./chatPreviews')
  chatMessagePreviews = module.chatMessagePreviews
  bookingPreviews = module.bookingPreviews
  contactChatPreviews = module.contactChatPreviews
})

beforeEach(() => {
  jest.resetAllMocks()
  mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([])
  mockDatabase.dbSelectChatMessageImageInfos.mockResolvedValue([])
  mockDatabase.dbSelectBookingLinesOfUser.mockResolvedValue([])
  mockChatMemberUsers.mockResolvedValue(new Map())
})

const HOME = 'a1b2c3d4-0000-4000-8000-0000000000aa'
const me = { communityUuid: HOME, gradidoId: 'b0b0b0b0-1111-4111-8111-111111111111' }
const elfi = { communityUuid: HOME, gradidoId: 'e1f1e1f1-2222-4222-8222-222222222222' }

const messageRow = (
  id: number,
  sender: { communityUuid: string; gradidoId: string },
  fields: Record<string, unknown> = {},
) => ({
  id,
  messageUuid: `abcdef00-0000-4000-8000-${String(id).padStart(12, '0')}`,
  conversationId: 7,
  senderCommunityUuid: sender.communityUuid,
  senderGradidoId: sender.gradidoId,
  subject: null,
  body: `message ${id}`,
  createdAt: new Date(`2026-10-2${id % 10}T10:00:00.000Z`),
  ...fields,
})

describe('chatMessagePreviews', () => {
  it('says whose a message is, by the pair the way the columns compare it', async () => {
    mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([
      messageRow(1, { communityUuid: HOME.toUpperCase(), gradidoId: me.gradidoId.toUpperCase() }),
      messageRow(2, elfi),
    ])
    const previews = await chatMessagePreviews([1, 2], me, { namingWriters: false })
    expect(previews.get(1)?.mine).toBe(true)
    expect(previews.get(2)?.mine).toBe(false)
  })

  it('begins with the subject and the text, and takes the moment it arrived', async () => {
    const row = messageRow(3, elfi, { subject: 'Einladung', body: 'Hallo\nBernd' })
    mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([row])
    const preview = (await chatMessagePreviews([3], me, { namingWriters: false })).get(3)
    expect(preview).toMatchObject({
      excerpt: 'Einladung\n\nHallo\nBernd',
      amount: null,
      senderUser: null,
      at: row.createdAt,
    })
  })

  it('takes the beginning only, as an answer quotes a message', async () => {
    mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([
      messageRow(4, elfi, { body: '🌱'.repeat(300) }),
    ])
    const preview = (await chatMessagePreviews([4], me, { namingWriters: false })).get(4)
    expect([...(preview?.excerpt ?? '')]).toHaveLength(200)
  })

  it('knows a picture by the uuid of its message, without regard to case', async () => {
    const withPicture = messageRow(5, elfi)
    mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([withPicture, messageRow(6, elfi)])
    mockDatabase.dbSelectChatMessageImageInfos.mockResolvedValue([
      { messageUuid: withPicture.messageUuid.toUpperCase() },
    ])
    const previews = await chatMessagePreviews([5, 6], me, { namingWriters: false })
    expect(previews.get(5)?.hasImage).toBe(true)
    expect(previews.get(6)?.hasImage).toBe(false)
  })

  describe('naming the writer, in a group', () => {
    it("names the writer of somebody else's message, and nobody for one's own", async () => {
      const elfiUser = { alias: 'Elfi' }
      mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([
        messageRow(7, elfi),
        messageRow(8, me),
      ])
      mockChatMemberUsers.mockResolvedValue(new Map([[`${HOME}/${elfi.gradidoId}`, elfiUser]]))
      const previews = await chatMessagePreviews([7, 8], me, { namingWriters: true })
      expect(previews.get(7)?.senderUser).toBe(elfiUser)
      expect(previews.get(8)?.senderUser).toBeNull()
      // Only the others are looked up, all in one go.
      expect(mockChatMemberUsers).toHaveBeenCalledTimes(1)
      expect(mockChatMemberUsers).toHaveBeenCalledWith([elfi])
    })

    it('leaves a writer unnamed whose users row is gone', async () => {
      mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([messageRow(9, elfi)])
      const previews = await chatMessagePreviews([9], me, { namingWriters: true })
      expect(previews.get(9)?.senderUser).toBeNull()
    })

    it('looks nobody up between two members', async () => {
      mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([messageRow(10, elfi)])
      await chatMessagePreviews([10], me, { namingWriters: false })
      expect(mockChatMemberUsers).not.toHaveBeenCalled()
    })
  })

  it('asks for no pictures where there is no message', async () => {
    const previews = await chatMessagePreviews([11], me, { namingWriters: true })
    expect(previews.size).toBe(0)
    expect(mockDatabase.dbSelectChatMessageImageInfos).not.toHaveBeenCalled()
  })
})

const bookingLine = (id: number, fields: Record<string, unknown> = {}) => ({
  id,
  typeId: mockDatabase.TransactionTypeId.SEND,
  amount: GradidoUnit.fromString('-20'),
  memo: 'Danke für Deine Hilfe',
  balanceDate: new Date('2026-10-21T10:00:00.000Z'),
  ...fields,
})

describe('bookingPreviews', () => {
  it('says the member gave the Gradido of a SEND row, and was given those of a RECEIVE row', async () => {
    mockDatabase.dbSelectBookingLinesOfUser.mockResolvedValue([
      bookingLine(1),
      bookingLine(2, {
        typeId: mockDatabase.TransactionTypeId.RECEIVE,
        amount: GradidoUnit.fromString('5'),
      }),
    ])
    const previews = await bookingPreviews(42, [1, 2])
    expect(mockDatabase.dbSelectBookingLinesOfUser).toHaveBeenCalledWith(42, [1, 2])
    expect(previews.get(1)?.mine).toBe(true)
    expect(previews.get(2)?.mine).toBe(false)
  })

  it('carries the memo, the amount without its sign and the booking time', async () => {
    const line = bookingLine(3)
    mockDatabase.dbSelectBookingLinesOfUser.mockResolvedValue([line])
    const preview = (await bookingPreviews(42, [3])).get(3)
    expect(preview?.excerpt).toBe('Danke für Deine Hilfe')
    expect(Number(preview?.amount?.toString())).toBe(20)
    expect(preview?.amount?.isNegative()).toBe(false)
    expect(preview?.hasImage).toBe(false)
    expect(preview?.senderUser).toBeNull()
    expect(preview?.at).toBe(line.balanceDate)
  })

  it('makes no line of a row without an amount: it would name a wrong one', async () => {
    mockDatabase.dbSelectBookingLinesOfUser.mockResolvedValue([bookingLine(4, { amount: null })])
    expect((await bookingPreviews(42, [4])).size).toBe(0)
  })
})

describe('contactChatPreviews', () => {
  const row = (lastChatMessageId: number | null, lastBookingId: number | null) =>
    ({ lastChatMessageId, lastBookingId }) as never

  it('shows for each contact the later of the latest message and the latest booking', async () => {
    mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([
      messageRow(1, elfi, { createdAt: new Date('2026-10-22T10:00:00.000Z') }),
      messageRow(2, elfi, { createdAt: new Date('2026-10-20T10:00:00.000Z') }),
    ])
    mockDatabase.dbSelectBookingLinesOfUser.mockResolvedValue([
      bookingLine(11, { balanceDate: new Date('2026-10-21T10:00:00.000Z') }),
      bookingLine(12, { balanceDate: new Date('2026-10-21T10:00:00.000Z') }),
    ])
    const previews = await contactChatPreviews(42, me, [row(1, 11), row(2, 12)])
    expect(previews[0]?.amount).toBeNull()
    expect(previews[0]?.excerpt).toBe('message 1')
    expect(Number(previews[1]?.amount?.toString())).toBe(20)
  })

  it('shows whichever there is, and nothing for a contact with neither', async () => {
    mockDatabase.dbSelectChatMessagesByIds.mockResolvedValue([messageRow(3, elfi)])
    mockDatabase.dbSelectBookingLinesOfUser.mockResolvedValue([bookingLine(13)])
    const previews = await contactChatPreviews(42, me, [
      row(3, null),
      row(null, 13),
      row(null, null),
    ])
    expect(previews[0]?.excerpt).toBe('message 3')
    expect(previews[1]?.excerpt).toBe('Danke für Deine Hilfe')
    expect(previews[2]).toBeNull()
  })

  it('asks for the messages and the bookings of the whole list at once, and names no writer', async () => {
    await contactChatPreviews(42, me, [row(1, null), row(null, 11), row(2, 12), row(null, null)])
    expect(mockDatabase.dbSelectChatMessagesByIds).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbSelectChatMessagesByIds).toHaveBeenCalledWith([1, 2])
    expect(mockDatabase.dbSelectBookingLinesOfUser).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbSelectBookingLinesOfUser).toHaveBeenCalledWith(42, [11, 12])
    expect(mockChatMemberUsers).not.toHaveBeenCalled()
  })
})
