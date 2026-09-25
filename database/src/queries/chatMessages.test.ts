// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { v4 as uuidv4 } from 'uuid'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import {
  ChatMessageInsert,
  ChatMessageSelect,
  chatConversationMembersTable,
  chatMessagesTable,
} from '../schemas'
import { ChatMemberRef, dbInsertChatConversationMembers } from './chatConversationMembers'
import {
  dbInsertChatMessage,
  dbSelectChatMessagesByConversationId,
  dbSelectChatMessagesPage,
  dbSelectChatMessagesSince,
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

  // The uuid comes from the sending server's payload. Used again for another conversation or
  // by another sender, it names another message: nothing is filed, and the first row stays.
  it('refuses a uuid that is used again for another conversation or by another sender', async () => {
    const before = await dbSelectChatMessagesByConversationId(CONVERSATION)

    const elsewhere = await dbInsertChatMessage(
      message(FIRST, { conversationId: OTHER_CONVERSATION }),
    )
    const someoneElse = await dbInsertChatMessage(
      message(FIRST, { senderGradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }),
    )

    for (const result of [elsewhere, someoneElse]) {
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.name).toBe('DBInsertFailed')
      }
    }
    expect(await dbSelectChatMessagesByConversationId(CONVERSATION)).toEqual(before)
    expect(await dbSelectChatMessagesByConversationId(OTHER_CONVERSATION)).toEqual([])
  })

  it('takes a delivery that came twice as the same message whatever the case of its sender', async () => {
    const again = await dbInsertChatMessage(message(FIRST, { senderGradidoId: ANNA.toUpperCase() }))
    expect(again.success).toBe(true)
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

describe('dbSelectChatMessagesPage', () => {
  const PAGED = 817
  // Five messages in the order they arrive, the third of them deleted later on.
  const PAGED_UUIDS = [1, 2, 3, 4, 5].map((n) => `30000000-0000-4000-8000-00000000000${n}`)
  let filed: ChatMessageSelect[]

  const uuidsOf = (messages: ChatMessageSelect[]) => messages.map((m) => m.messageUuid)

  beforeAll(async () => {
    filed = []
    for (const uuid of PAGED_UUIDS) {
      const stored = await dbInsertChatMessage(message(uuid, { conversationId: PAGED }))
      if (!stored.success) {
        throw new Error(`fixture: ${uuid} was not filed`)
      }
      filed.push(stored.value)
    }
    // Another conversation's message in between, which no page of this one may carry.
    await dbInsertChatMessage(
      message('30000000-0000-4000-8000-000000000009', { conversationId: PAGED + 1 }),
    )
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, filed[2].id))
  })

  it('hands out the newest messages without a cursor, oldest of them first', async () => {
    const page = await dbSelectChatMessagesPage(PAGED, { limit: 2 })
    expect(uuidsOf(page.messages)).toEqual([PAGED_UUIDS[3], PAGED_UUIDS[4]])
    expect(page.messages[0].id).toBeLessThan(page.messages[1].id)
    expect(page.hasMore).toBe(true)
  })

  it('hands out the older ones before the cursor, and leaves the deleted one out', async () => {
    const page = await dbSelectChatMessagesPage(PAGED, { before: filed[3].id, limit: 2 })
    expect(uuidsOf(page.messages)).toEqual([PAGED_UUIDS[0], PAGED_UUIDS[1]])
    // Exactly two left below the cursor, and a page of two: nothing more to load.
    expect(page.hasMore).toBe(false)
  })

  it('says there is more exactly when one message did not fit', async () => {
    // Four messages are left once the deleted one is gone.
    const all = await dbSelectChatMessagesPage(PAGED, { limit: 4 })
    expect(uuidsOf(all.messages)).toEqual([
      PAGED_UUIDS[0],
      PAGED_UUIDS[1],
      PAGED_UUIDS[3],
      PAGED_UUIDS[4],
    ])
    expect(all.hasMore).toBe(false)
    const oneShort = await dbSelectChatMessagesPage(PAGED, { limit: 3 })
    expect(uuidsOf(oneShort.messages)).toEqual([PAGED_UUIDS[1], PAGED_UUIDS[3], PAGED_UUIDS[4]])
    expect(oneShort.hasMore).toBe(true)
  })

  it('never shows a deleted message, whatever the page', async () => {
    const around = await dbSelectChatMessagesPage(PAGED, { before: filed[4].id, limit: 10 })
    expect(uuidsOf(around.messages)).not.toContain(PAGED_UUIDS[2])
    expect(uuidsOf(around.messages)).toEqual([PAGED_UUIDS[0], PAGED_UUIDS[1], PAGED_UUIDS[3]])
  })

  it('answers an empty page for a conversation without messages, and below its first one', async () => {
    expect(await dbSelectChatMessagesPage(4242, { limit: 50 })).toEqual({
      messages: [],
      hasMore: false,
    })
    expect(await dbSelectChatMessagesPage(PAGED, { before: filed[0].id, limit: 50 })).toEqual({
      messages: [],
      hasMore: false,
    })
  })

  it('refuses a page size below one', async () => {
    await expect(dbSelectChatMessagesPage(PAGED, { limit: 0 })).rejects.toThrow('page size')
  })
})

/**
 * What is new for one member, across every conversation the member is in (E-017). Its own
 * people, with pairs made for this block: the query reaches every conversation a member is in,
 * so a conversation another block left behind must not have them in it.
 */
describe('dbSelectChatMessagesSince', () => {
  const pair = (): ChatMemberRef => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const LENA = pair()
  const MAX = pair()
  const NIKO = pair()
  const OTTO = pair()
  // Lena and Max; a group of Lena, Niko and Otto -- members, and no pair key (P5); and Max and
  // Niko, which Lena is not in.
  const WITH_MAX = 831
  const GROUP = 832
  const WITHOUT_LENA = 833
  // The messages in the order they arrive: conversation, sender, text.
  const ARRIVALS: [number, ChatMemberRef, string][] = [
    [WITH_MAX, LENA, 'Lena to Max'],
    [WITHOUT_LENA, MAX, 'Max to Niko'],
    [GROUP, NIKO, 'Niko to the group'],
    [WITH_MAX, MAX, 'Max to Lena'],
    [WITHOUT_LENA, NIKO, 'Niko to Max'],
    [GROUP, LENA, 'Lena to the group'],
    [WITH_MAX, MAX, 'Max again, deleted later'],
    [GROUP, OTTO, 'Otto to the group'],
  ]
  let filed: ChatMessageSelect[]

  const bodiesOf = (messages: ChatMessageSelect[]) => messages.map((m) => m.body)
  const since = (afterId: number, limit = 50) => dbSelectChatMessagesSince(LENA, { afterId, limit })

  beforeAll(async () => {
    await dbInsertChatConversationMembers(WITH_MAX, [LENA, MAX])
    await dbInsertChatConversationMembers(GROUP, [LENA, NIKO, OTTO])
    await dbInsertChatConversationMembers(WITHOUT_LENA, [MAX, NIKO])
    filed = []
    for (const [conversationId, sender, body] of ARRIVALS) {
      const stored = await dbInsertChatMessage(
        message(uuidv4(), {
          conversationId,
          senderCommunityUuid: sender.communityUuid,
          senderGradidoId: sender.gradidoId,
          subject: null,
          body,
        }),
      )
      if (!stored.success) {
        throw new Error(`fixture: "${body}" was not filed`)
      }
      filed.push(stored.value)
    }
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, filed[6].id))
  })

  afterAll(async () => {
    await db
      .delete(chatConversationMembersTable)
      .where(inArray(chatConversationMembersTable.conversationId, [WITH_MAX, GROUP, WITHOUT_LENA]))
  })

  it('hands out the messages of every conversation the member is in, in the order they arrived', async () => {
    const news = await since(0)
    expect(bodiesOf(news.messages)).toEqual([
      'Lena to Max',
      'Niko to the group',
      'Max to Lena',
      'Lena to the group',
      'Otto to the group',
    ])
    const ids = news.messages.map((m) => m.id)
    expect([...ids].sort((a, b) => a - b)).toEqual(ids)
    expect(news.hasMore).toBe(false)
  })

  it('never hands out a message of a conversation the member is not in', async () => {
    const ids = (await since(0)).messages.map((m) => m.id)
    expect(ids).not.toContain(filed[1].id)
    expect(ids).not.toContain(filed[4].id)
    // Max gets them: he is in that conversation -- and in Lena's, but not in the group.
    const maxs = await dbSelectChatMessagesSince(MAX, { afterId: 0, limit: 50 })
    expect(bodiesOf(maxs.messages)).toEqual([
      'Lena to Max',
      'Max to Niko',
      'Max to Lena',
      'Niko to Max',
    ])
  })

  // A second device or tab of the same person learns what was written elsewhere.
  it("hands out the member's own messages as well", async () => {
    const own = (await since(0)).messages.filter((m) => m.senderGradidoId === LENA.gradidoId)
    expect(bodiesOf(own)).toEqual(['Lena to Max', 'Lena to the group'])
  })

  it('starts exactly after the id it is given', async () => {
    expect(bodiesOf((await since(filed[3].id)).messages)).toEqual([
      'Lena to the group',
      'Otto to the group',
    ])
    expect(bodiesOf((await since(filed[3].id - 1)).messages)).toEqual([
      'Max to Lena',
      'Lena to the group',
      'Otto to the group',
    ])
    expect(await since(filed[7].id)).toEqual({ messages: [], hasMore: false })
  })

  it('leaves out a message marked deleted', async () => {
    expect(bodiesOf((await since(0)).messages)).not.toContain('Max again, deleted later')
    // After Lena's message to the group come the deleted one and Otto's. With a cap of one it is
    // Otto's, and nothing is left over the cap.
    const afterIt = await since(filed[5].id, 1)
    expect(bodiesOf(afterIt.messages)).toEqual(['Otto to the group'])
    expect(afterIt.hasMore).toBe(false)
  })

  it('caps the answer, says there is more exactly when one did not fit, and goes on from there', async () => {
    const first = await since(0, 2)
    expect(bodiesOf(first.messages)).toEqual(['Lena to Max', 'Niko to the group'])
    expect(first.hasMore).toBe(true)

    const second = await since(first.messages[1].id, 2)
    expect(bodiesOf(second.messages)).toEqual(['Max to Lena', 'Lena to the group'])
    expect(second.hasMore).toBe(true)

    // One left, and a cap of one: it fits, so there is nothing more.
    const third = await since(second.messages[1].id, 1)
    expect(bodiesOf(third.messages)).toEqual(['Otto to the group'])
    expect(third.hasMore).toBe(false)
  })

  it('answers the same for the member named in capitals, as the column compares', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: LENA.gradidoId.toUpperCase() }
    expect(await dbSelectChatMessagesSince(shouting, { afterId: 0, limit: 50 })).toEqual(
      await since(0),
    )
  })

  it('answers nothing for somebody in no conversation', async () => {
    expect(await dbSelectChatMessagesSince(pair(), { afterId: 0, limit: 50 })).toEqual({
      messages: [],
      hasMore: false,
    })
  })

  it('refuses a cap below one and an id below zero', async () => {
    await expect(since(0, 0)).rejects.toThrow('page size')
    await expect(since(-1)).rejects.toThrow('message id')
  })
})
