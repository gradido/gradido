// AI-GENERATED — not an architecture reference
import {
  ChatMessageSelect,
  User as DbUser,
  dbSelectChatMessagesSince,
  dbSelectChatUnreadSummary,
} from 'database'
import { CHAT_UPDATE_MESSAGES_DEFAULT } from '@/data/ChatConversation.logic'
import { Context, newRequestBudget } from '@/server/context'
import { ChatResolver } from './ChatResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself --
// the order of its two reads and the id it hands on. The order cannot be brought about on
// purpose against a database; ChatResolver.test.ts runs the same query against one.
jest.mock('database', () => {
  const originalModule = jest.requireActual('database')
  return {
    __esModule: true,
    ...originalModule,
    dbSelectChatUnreadSummary: jest.fn(),
    dbSelectChatMessagesSince: jest.fn(),
  }
})

const HOME = '11111111-1111-4111-8111-111111111111'
const LENA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MAX = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

const summary = dbSelectChatUnreadSummary as jest.MockedFunction<typeof dbSelectChatUnreadSummary>
const since = dbSelectChatMessagesSince as jest.MockedFunction<typeof dbSelectChatMessagesSince>

/** A request of Lena's, with a budget of its own. */
const lenasRequest = (): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: { communityUuid: HOME, gradidoID: LENA } as unknown as DbUser,
})

/** A message Max wrote to Lena, filed under this id. */
const fromMax = (id: number): ChatMessageSelect => ({
  id,
  messageUuid: `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
  conversationId: 3,
  senderCommunityUuid: HOME,
  senderGradidoId: MAX,
  subject: null,
  body: 'hello',
  notify: 'email',
  deliveryState: 'delivered',
  lastAttemptAt: null,
  delaySeconds: null,
  createdAt: new Date('2026-09-25T06:00:00.000Z'),
  deletedAt: null,
})

const ask = (afterId: number | null, limit: number | null = null) =>
  new ChatResolver().newChatMessagesSince({ afterId, limit }, lenasRequest())

beforeEach(() => {
  summary.mockReset()
  since.mockReset()
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
      return { latestId: 9, unreadConversations: 1 }
    })
    since.mockImplementation(async () => {
      steps.push('news asked')
      return { messages: [], hasMore: false }
    })

    await ask(5)

    expect(steps).toEqual(['summary asked', 'summary answered', 'news asked'])
  })

  it('hands on the last message it hands out -- under hasMore not the highest there is', async () => {
    summary.mockResolvedValue({ latestId: 60, unreadConversations: 1 })
    since.mockResolvedValue({ messages: [fromMax(11), fromMax(12)], hasMore: true })

    const update = await ask(10, 2)

    expect(update.latestId).toBe(12)
    expect(update.hasMore).toBe(true)
    expect(update.messages.map((message) => message.id)).toEqual([11, 12])
    expect(update.messages.map((message) => message.mine)).toEqual([false, false])
  })

  it('hands on the highest id of the caller when nothing is new', async () => {
    summary.mockResolvedValue({ latestId: 60, unreadConversations: 0 })
    since.mockResolvedValue({ messages: [], hasMore: false })

    expect(await ask(60)).toEqual({
      latestId: 60,
      unreadConversations: 0,
      messages: [],
      hasMore: false,
    })
  })

  it('says only where the caller stands when it has no afterId, and reads no messages', async () => {
    summary.mockResolvedValue({ latestId: 33, unreadConversations: 2 })

    expect(await ask(null)).toEqual({
      latestId: 33,
      unreadConversations: 2,
      messages: [],
      hasMore: false,
    })
    expect(since).not.toHaveBeenCalled()
  })

  it('asks for the default number of messages when the caller names none, for the caller', async () => {
    summary.mockResolvedValue({ latestId: 0, unreadConversations: 0 })
    since.mockResolvedValue({ messages: [], hasMore: false })

    await ask(0)

    expect(since).toHaveBeenCalledWith(
      { communityUuid: HOME, gradidoId: LENA },
      { afterId: 0, limit: CHAT_UPDATE_MESSAGES_DEFAULT },
    )
    expect(summary).toHaveBeenCalledWith({ communityUuid: HOME, gradidoId: LENA })
  })
})
