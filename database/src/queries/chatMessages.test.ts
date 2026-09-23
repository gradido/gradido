// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { ChatMessageInsert, chatMessagesTable } from '../schemas'
import {
  dbInsertChatMessage,
  dbSelectChatMessagesByConversationId,
  dbUpdateChatMessageDelivery,
} from './chatMessages'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No foreign key: a conversation id and the sender's pair are all a row needs.
const CONVERSATION = 815
const OTHER_CONVERSATION = 816
const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

const message = (
  messageUuid: string,
  rest: Partial<ChatMessageInsert> = {},
): ChatMessageInsert => ({
  messageUuid,
  conversationId: CONVERSATION,
  senderCommunityUuid: HOME,
  senderGradidoId: ANNA,
  subject: 'About Saturday',
  body: 'Shall we meet at ten?',
  notify: 'email',
  deliveryState: 'delivered',
  ...rest,
})

const FIRST = '10000000-0000-4000-8000-000000000001'
const SECOND = '10000000-0000-4000-8000-000000000002'
const THIRD = '10000000-0000-4000-8000-000000000003'

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(chatMessagesTable)
})
afterAll(async () => {
  await db.delete(chatMessagesTable)
  await appDB.destroy()
})

describe('chatMessages query test', () => {
  it('starts empty', async () => {
    expect(await dbSelectChatMessagesByConversationId(CONVERSATION)).toEqual([])
  })

  it('files a message and hands back its row', async () => {
    const stored = await dbInsertChatMessage(message(FIRST))
    expect(stored.success).toBe(true)
    if (!stored.success) {
      return
    }
    expect(stored.value).toMatchObject({
      messageUuid: FIRST,
      conversationId: CONVERSATION,
      senderCommunityUuid: HOME,
      senderGradidoId: ANNA,
      subject: 'About Saturday',
      body: 'Shall we meet at ten?',
      notify: 'email',
      deliveryState: 'delivered',
      lastAttemptAt: null,
      delaySeconds: null,
      deletedAt: null,
    })
    expect(stored.value.id).toBeGreaterThan(0)
    expect(stored.value.createdAt).toBeInstanceOf(Date)
  })

  it('files a message without a subject', async () => {
    const stored = await dbInsertChatMessage(message(SECOND, { subject: null, body: 'Yes' }))
    expect(stored.success && stored.value.subject).toBeNull()
  })

  it('keeps one row for a message delivered twice, and hands back the first', async () => {
    const first = await dbSelectChatMessagesByConversationId(CONVERSATION)
    const again = await dbInsertChatMessage(
      message(FIRST, { body: 'the same uuid with another text', deliveryState: 'pending' }),
    )

    expect(again.success).toBe(true)
    if (!again.success) {
      return
    }
    expect(again.value.id).toBe(first[0].id)
    expect(again.value.body).toBe('Shall we meet at ten?')
    expect(again.value.deliveryState).toBe('delivered')
    expect(await dbSelectChatMessagesByConversationId(CONVERSATION)).toHaveLength(2)
  })

  it('reads a conversation in the order the messages arrived, and only that conversation', async () => {
    await dbInsertChatMessage(message(THIRD, { conversationId: OTHER_CONVERSATION }))
    const messages = await dbSelectChatMessagesByConversationId(CONVERSATION)
    expect(messages.map((m) => m.messageUuid)).toEqual([FIRST, SECOND])
    expect(messages[0].id).toBeLessThan(messages[1].id)
    expect(
      (await dbSelectChatMessagesByConversationId(OTHER_CONVERSATION)).map((m) => m.messageUuid),
    ).toEqual([THIRD])
  })

  it('moves a message from pending to delivered and stamps the attempt', async () => {
    const pending = await dbInsertChatMessage(
      message('20000000-0000-4000-8000-000000000001', { deliveryState: 'pending' }),
    )
    if (!pending.success) {
      throw new Error('fixture: the pending message was not filed')
    }
    expect(pending.value.deliveryState).toBe('pending')

    const attempt = new Date('2026-09-23T12:00:00.000Z')
    expect(await dbUpdateChatMessageDelivery(pending.value.id, 'delivered', attempt)).toEqual({
      success: true,
    })
    const [row] = (await dbSelectChatMessagesByConversationId(CONVERSATION)).filter(
      (m) => m.id === pending.value.id,
    )
    expect(row.deliveryState).toBe('delivered')
    expect(row.lastAttemptAt?.getTime()).toBe(attempt.getTime())

    // The same state once more is still a success (FOUND_ROWS), and moves the stamp.
    const later = new Date('2026-09-23T12:05:00.000Z')
    expect(await dbUpdateChatMessageDelivery(pending.value.id, 'delivered', later)).toEqual({
      success: true,
    })
    const [again] = (await dbSelectChatMessagesByConversationId(CONVERSATION)).filter(
      (m) => m.id === pending.value.id,
    )
    expect(again.lastAttemptAt?.getTime()).toBe(later.getTime())
  })

  it('marks a message whose delivery failed', async () => {
    const pending = await dbInsertChatMessage(
      message('20000000-0000-4000-8000-000000000002', { deliveryState: 'pending' }),
    )
    if (!pending.success) {
      throw new Error('fixture: the pending message was not filed')
    }

    await dbUpdateChatMessageDelivery(pending.value.id, 'failed', new Date())

    const [row] = (await dbSelectChatMessagesByConversationId(CONVERSATION)).filter(
      (m) => m.id === pending.value.id,
    )
    expect(row.deliveryState).toBe('failed')
    expect(row.lastAttemptAt).toBeInstanceOf(Date)
  })

  it('reports an id without a row as not found', async () => {
    const result = await dbUpdateChatMessageDelivery(999999999, 'delivered', new Date())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.name).toBe('DBNotFoundError')
    }
  })
})
