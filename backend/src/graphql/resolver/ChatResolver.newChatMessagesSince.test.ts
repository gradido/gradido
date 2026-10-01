// AI-GENERATED — not an architecture reference
import {
  ChatMessageSelect,
  User as DbUser,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessagesEditedAfter,
  dbSelectChatMessagesSince,
  dbSelectChatUnreadSummary,
} from 'database'
import {
  CHAT_EDITS_SETTLE_MS,
  CHAT_UPDATE_MESSAGES_DEFAULT,
  chatEditsCursor,
} from '@/data/ChatConversation.logic'
import { Context, newRequestBudget } from '@/server/context'
import { ChatResolver } from './ChatResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself --
// the order of its reads and the two cursors it hands on. The order cannot be brought about on
// purpose against a database; ChatResolver.test.ts runs the same query against one.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectChatUnreadSummary: jest.fn(),
    dbSelectChatMessagesSince: jest.fn(),
    dbSelectChatMessagesEditedAfter: jest.fn(),
    dbSelectChatMessageImageInfos: jest.fn(),
    // No group among these conversations: the messages here are between two members (P5 asks
    // for every page and update which of its conversations are groups).
    dbSelectChatGroupUuids: jest.fn(async () => new Map()),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

// The database's clock at the beat, and the moment the changes count as settled up to.
const NOW = new Date('2026-10-01T09:00:30.000Z')
const SETTLED = new Date(NOW.getTime() - CHAT_EDITS_SETTLE_MS)
/** A moment so many milliseconds before what is settled. */
const before = (ms: number) => new Date(SETTLED.getTime() - ms)
/** The cursor an answer hands on where it held every change: the settled moment, all of it. */
const SETTLED_CURSOR = chatEditsCursor({ editedAt: SETTLED, id: 0 })
/** A cursor of the wallet's from an earlier beat: a settled moment so long ago. */
const cursorFrom = (ms: number) => chatEditsCursor({ editedAt: before(ms), id: 0 })

const summary = dbSelectChatUnreadSummary as jest.MockedFunction<typeof dbSelectChatUnreadSummary>
const since = dbSelectChatMessagesSince as jest.MockedFunction<typeof dbSelectChatMessagesSince>
const editedAfter = dbSelectChatMessagesEditedAfter as jest.MockedFunction<
  typeof dbSelectChatMessagesEditedAfter
>
const infos = dbSelectChatMessageImageInfos as jest.MockedFunction<
  typeof dbSelectChatMessageImageInfos
>

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: { communityUuid: HOME, gradidoID: LENA } as unknown as DbUser,
})

/** A message Max wrote to Lena, filed under this id. */
const fromMax = (id: number, rest: Partial<ChatMessageSelect> = {}): ChatMessageSelect => ({
  id,
  messageUuid: `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
  conversationId: 3,
  senderCommunityUuid: HOME,
  senderGradidoId: MAX,
  subject: null,
  body: 'hello',
  notify: 'email',
  mailState: null,
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  forwardedFromCommunityUuid: null,
  forwardedFromGradidoId: null,
  createdAt: new Date('2026-09-25T06:00:00.000Z'),
  editedAt: null,
  deletedAt: null,
  ...rest,
})

/** The same message with its text changed at that moment. */
const changed = (id: number, editedAt: Date): ChatMessageSelect =>
  fromMax(id, { body: 'hello, changed', editedAt })

const ask = (afterId: number | null, limit: number | null = null, cursor: string | null = null) =>
  new ChatResolver().newChatMessagesSince({ afterId, limit, editedCursor: cursor }, lenasRequest())

/** Where the caller stands, read at the beat's moment. */
const standing = (latestId: number, unreadConversations: number) => ({
  latestId,
  unreadConversations,
  now: NOW,
})

beforeEach(() => {
  summary.mockReset()
  since.mockReset()
  editedAfter.mockReset()
  infos.mockReset()
  infos.mockResolvedValue([])
  since.mockResolvedValue({ messages: [], hasMore: false })
  editedAfter.mockResolvedValue({ messages: [], hasMore: false })
})

describe('newChatMessagesSince, what the resolver decides itself', () => {
  // ⛔ Without messages the answer hands on the highest id the summary saw. Read side by side,
  // the summary could see a message the other read did not, and the wallet would move past it
  // for good. So the second read may start only once the first has answered.
  it('reads where the caller stands before it looks for what is new', async () => {
    const steps: string[] = []
    summary.mockImplementation(async () => {
      steps.push('summary asked')
      await new Promise((resolve) => setImmediate(resolve))
      steps.push('summary answered')
      return standing(9, 1)
    })
    since.mockImplementation(async () => {
      steps.push('news asked')
      return { messages: [], hasMore: false }
    })

    await ask(5)

    expect(steps).toEqual(['summary asked', 'summary answered', 'news asked'])
  })

  it('hands on the last message it hands out -- under hasMore not the highest there is', async () => {
    summary.mockResolvedValue(standing(60, 1))
    since.mockResolvedValue({ messages: [fromMax(11), fromMax(12)], hasMore: true })

    const update = await ask(10, 2)

    expect(update.latestId).toBe(12)
    expect(update.hasMore).toBe(true)
    expect(update.messages.map((message) => message.id)).toEqual([11, 12])
    expect(update.messages.map((message) => message.mine)).toEqual([false, false])
  })

  it('hands on the highest id of the caller when nothing is new', async () => {
    summary.mockResolvedValue(standing(60, 0))

    expect(await ask(60)).toEqual({
      latestId: 60,
      unreadConversations: 0,
      messages: [],
      hasMore: false,
      edited: [],
      editedCursor: SETTLED_CURSOR,
    })
  })

  it('says only where the caller stands when it has no afterId, and reads no messages', async () => {
    summary.mockResolvedValue(standing(33, 2))

    expect(await ask(null)).toEqual({
      latestId: 33,
      unreadConversations: 2,
      messages: [],
      hasMore: false,
      edited: [],
      editedCursor: SETTLED_CURSOR,
    })
    expect(since).not.toHaveBeenCalled()
    expect(editedAfter).not.toHaveBeenCalled()
  })

  it('asks for the default number of messages when the caller names none, for the caller', async () => {
    summary.mockResolvedValue(standing(0, 0))

    await ask(0)

    expect(since).toHaveBeenCalledWith(
      { communityUuid: HOME, gradidoId: LENA },
      { afterId: 0, limit: CHAT_UPDATE_MESSAGES_DEFAULT },
    )
    expect(summary).toHaveBeenCalledWith({ communityUuid: HOME, gradidoId: LENA })
  })

  // P7: the pictures of everything handed out, in one query -- never one per message.
  it('asks for the pictures of the messages it hands out in one query, and hands them on', async () => {
    summary.mockResolvedValue(standing(60, 1))
    since.mockResolvedValue({ messages: [fromMax(11), fromMax(12)], hasMore: false })
    const PICTURE = '40000000-0000-4000-8000-000000000012'
    infos.mockResolvedValue([
      {
        imageUuid: PICTURE,
        messageUuid: fromMax(12).messageUuid,
        position: 0,
        width: 924,
        height: 520,
      },
    ])

    const update = await ask(10)

    expect(infos.mock.calls).toEqual([[[fromMax(11).messageUuid, fromMax(12).messageUuid]]])
    expect(update.messages.map((message) => message.images)).toEqual([
      [],
      [{ imageUuid: PICTURE, width: 924, height: 520 }],
    ])
  })
})

/**
 * The messages whose text was changed (E-060), on the same beat: asked for by the database's
 * clock, with room to spare -- the place an answer hands on lies CHAT_EDITS_SETTLE_MS behind the
 * clock, so that a change committed a moment after the beat read comes with the next one.
 */
describe('newChatMessagesSince, the changed messages (E-060)', () => {
  beforeEach(() => {
    summary.mockResolvedValue(standing(60, 0))
  })

  it('hands out what was changed after the place the caller names, as it stands now', async () => {
    const at = before(2_000)
    editedAfter.mockResolvedValue({ messages: [changed(7, at)], hasMore: false })

    const update = await ask(60, null, chatEditsCursor({ editedAt: before(5_000), id: 3 }))

    expect(editedAfter).toHaveBeenCalledWith(
      { communityUuid: HOME, gradidoId: LENA },
      { after: { editedAt: before(5_000), id: 3 }, limit: CHAT_UPDATE_MESSAGES_DEFAULT },
    )
    expect(update.edited).toHaveLength(1)
    expect(update.edited[0]).toMatchObject({
      id: 7,
      body: 'hello, changed',
      editedAt: at,
      mine: false,
    })
    // Not among the new ones: it is an old message with another text.
    expect(update.messages).toEqual([])
  })

  // ⛔ The clock comes with the first read. Read after the changes were looked for, a change
  // committed in between would lie before the moment handed on, with no room left for it.
  it('reads the clock before it looks for what was changed', async () => {
    const steps: string[] = []
    summary.mockImplementation(async () => {
      steps.push('clock asked')
      await new Promise((resolve) => setImmediate(resolve))
      steps.push('clock answered')
      return standing(60, 0)
    })
    editedAfter.mockImplementation(async () => {
      steps.push('changes asked')
      return { messages: [], hasMore: false }
    })

    await ask(60, null, cursorFrom(5_000))

    expect(steps).toEqual(['clock asked', 'clock answered', 'changes asked'])
  })

  it('hands on a moment ten seconds behind the clock, whether or not something was changed', async () => {
    expect((await ask(60, null, cursorFrom(5_000))).editedCursor).toBe(SETTLED_CURSOR)

    editedAfter.mockResolvedValue({ messages: [changed(7, before(1_000))], hasMore: false })
    expect((await ask(60, null, cursorFrom(5_000))).editedCursor).toBe(SETTLED_CURSOR)
    expect(SETTLED_CURSOR).toBe(`${NOW.getTime() - 10_000}-0`)
  })

  // The first beat of a wallet: it holds no cursor yet. Nothing is looked for, and the answer
  // says where to go on from.
  it('looks for no changes without a cursor, and says where to go on from', async () => {
    const update = await ask(60)

    expect(editedAfter).not.toHaveBeenCalled()
    expect(update.edited).toEqual([])
    expect(update.editedCursor).toBe(SETTLED_CURSOR)
  })

  it('goes each cursor its own way: changes without news, and news without changes', async () => {
    editedAfter.mockResolvedValue({ messages: [changed(7, before(2_000))], hasMore: false })
    const changesOnly = await ask(null, null, cursorFrom(5_000))
    expect(since).not.toHaveBeenCalled()
    expect(changesOnly.edited.map((message) => message.id)).toEqual([7])
    expect(changesOnly.latestId).toBe(60)

    since.mockResolvedValue({ messages: [fromMax(61)], hasMore: false })
    editedAfter.mockClear()
    const newsOnly = await ask(60)
    expect(editedAfter).not.toHaveBeenCalled()
    expect(newsOnly.messages.map((message) => message.id)).toEqual([61])
  })

  it('caps the changed messages as the new ones, by what the caller names', async () => {
    await ask(60, 7, cursorFrom(5_000))

    expect(since.mock.calls[0][1]).toEqual({ afterId: 60, limit: 7 })
    expect(editedAfter.mock.calls[0][1]).toEqual({
      after: { editedAt: before(5_000), id: 0 },
      limit: 7,
    })
  })

  // More are left over the cap: the next beat goes on exactly after the last one handed out --
  // its moment and its id, for another message changed in the same millisecond.
  it('goes on exactly after the last changed message it hands out where more are left', async () => {
    const last = before(60_000)
    editedAfter.mockResolvedValue({
      messages: [changed(7, before(90_000)), changed(8, last)],
      hasMore: true,
    })

    const update = await ask(60, 2, cursorFrom(120_000))

    expect(update.edited.map((message) => message.id)).toEqual([7, 8])
    expect(update.editedCursor).toBe(chatEditsCursor({ editedAt: last, id: 8 }))
  })

  // ⛔ A change before what is settled may still be on its way: the cursor never passes it.
  it('never goes on from later than what is settled, even where more are left', async () => {
    editedAfter.mockResolvedValue({
      messages: [changed(7, before(1_000)), changed(8, new Date(SETTLED.getTime() + 4_000))],
      hasMore: true,
    })

    expect((await ask(60, 2, cursorFrom(5_000))).editedCursor).toBe(SETTLED_CURSOR)
  })

  it('asks for the pictures of the changed messages as well, and hands them on', async () => {
    const PICTURE = '40000000-0000-4000-8000-000000000007'
    editedAfter.mockResolvedValue({ messages: [changed(7, before(2_000))], hasMore: false })
    infos.mockResolvedValue([
      { imageUuid: PICTURE, messageUuid: fromMax(7).messageUuid, position: 0, width: 4, height: 3 },
    ])

    const update = await ask(60, null, cursorFrom(5_000))

    expect(infos.mock.calls).toEqual([[[fromMax(7).messageUuid]]])
    expect(update.edited[0].images).toEqual([{ imageUuid: PICTURE, width: 4, height: 3 }])
  })
})
