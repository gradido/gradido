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
import {
  ChatMemberRef,
  dbInsertChatConversationMembers,
  dbSelectChatUnreadSummary,
} from './chatConversationMembers'
import {
  dbInsertChatMessage,
  dbSelectChatMessageForMember,
  dbSelectChatMessagesByConversationId,
  dbSelectChatMessagesByUuids,
  dbSelectChatMessagesEditedAfter,
  dbSelectChatMessagesPage,
  dbSelectChatMessagesReactedAfter,
  dbSelectChatMessagesSince,
  dbUpdateChatMessageBody,
  dbUpdateChatMessageDelivery,
  dbUpdateChatMessageMailState,
  dbUpdateChatMessageReactedAt,
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
      editedAt: null,
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

  it('moves a message from pending to delivered, stamps the attempt and notes the mail', async () => {
    const pending = await dbInsertChatMessage(
      message('20000000-0000-4000-8000-000000000001', { deliveryState: 'pending' }),
    )
    if (!pending.success) {
      throw new Error('fixture: the pending message was not filed')
    }
    expect(pending.value.deliveryState).toBe('pending')
    // E-034: nothing is known of a mail until the other server has answered.
    expect(pending.value.mailState).toBeNull()

    const attempt = new Date('2026-09-23T12:00:00.000Z')
    expect(
      await dbUpdateChatMessageDelivery(pending.value.id, 'delivered', attempt, 'mailed'),
    ).toEqual({ success: true })
    const [row] = (await dbSelectChatMessagesByConversationId(CONVERSATION)).filter(
      (m) => m.id === pending.value.id,
    )
    expect(row.deliveryState).toBe('delivered')
    expect(row.lastAttemptAt?.getTime()).toBe(attempt.getTime())
    expect(row.mailState).toBe('mailed')

    // The same state once more is still a success (FOUND_ROWS), and moves the stamp.
    const later = new Date('2026-09-23T12:05:00.000Z')
    expect(
      await dbUpdateChatMessageDelivery(pending.value.id, 'delivered', later, 'mailed'),
    ).toEqual({ success: true })
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

    await dbUpdateChatMessageDelivery(pending.value.id, 'failed', new Date(), null)

    const [row] = (await dbSelectChatMessagesByConversationId(CONVERSATION)).filter(
      (m) => m.id === pending.value.id,
    )
    expect(row.deliveryState).toBe('failed')
    expect(row.lastAttemptAt).toBeInstanceOf(Date)
    expect(row.mailState).toBeNull()
  })

  it('reports an id without a row as not found', async () => {
    const result = await dbUpdateChatMessageDelivery(999999999, 'delivered', new Date(), null)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.name).toBe('DBNotFoundError')
    }
  })

  // E-034: a message within the community has no delivery; only what became of its mail.
  it('notes what became of the mail of a local message, and changes nothing else', async () => {
    const local = await dbInsertChatMessage(message('20000000-0000-4000-8000-000000000003'))
    if (!local.success) {
      throw new Error('fixture: the local message was not filed')
    }

    expect(await dbUpdateChatMessageMailState(local.value.id, 'muted')).toEqual({ success: true })
    expect(await dbUpdateChatMessageMailState(local.value.id, 'muted')).toEqual({ success: true })

    const [row] = (await dbSelectChatMessagesByConversationId(CONVERSATION)).filter(
      (m) => m.id === local.value.id,
    )
    expect(row).toEqual({ ...local.value, mailState: 'muted' })
  })

  it('reports a mail state for an id without a row as not found', async () => {
    const result = await dbUpdateChatMessageMailState(999999999, 'mailed')
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

/**
 * What may be forwarded (E-059): a message, by its uuid, for a member of its conversation, while it
 * is not marked deleted -- and the first writer a forwarded copy carries (migration 0150).
 */
describe('dbSelectChatMessageForMember', () => {
  const pair = (): ChatMemberRef => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const LENA = pair()
  const MAX = pair()
  const NIKO = pair()
  const WITH_MAX = 841
  const WITHOUT_LENA = 842
  let lenas: ChatMessageSelect
  let othersOnly: ChatMessageSelect
  let deleted: ChatMessageSelect
  let forwarded: ChatMessageSelect

  const filed = async (row: ChatMessageInsert): Promise<ChatMessageSelect> => {
    const stored = await dbInsertChatMessage(row)
    if (!stored.success) {
      throw new Error(`fixture: "${row.body}" was not filed`)
    }
    return stored.value
  }
  const from = (sender: ChatMemberRef, conversationId: number, body: string, rest = {}) =>
    message(uuidv4(), {
      conversationId,
      senderCommunityUuid: sender.communityUuid,
      senderGradidoId: sender.gradidoId,
      subject: null,
      body,
      ...rest,
    })

  beforeAll(async () => {
    await dbInsertChatConversationMembers(WITH_MAX, [LENA, MAX])
    await dbInsertChatConversationMembers(WITHOUT_LENA, [MAX, NIKO])
    lenas = await filed(from(MAX, WITH_MAX, 'Max to Lena'))
    othersOnly = await filed(from(MAX, WITHOUT_LENA, 'Max to Niko'))
    deleted = await filed(from(MAX, WITH_MAX, 'Max to Lena, deleted later'))
    forwarded = await filed(
      from(LENA, WITH_MAX, 'Niko wrote this', {
        forwardedFromCommunityUuid: NIKO.communityUuid,
        forwardedFromGradidoId: NIKO.gradidoId,
      }),
    )
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, deleted.id))
  })

  afterAll(async () => {
    await db
      .delete(chatConversationMembersTable)
      .where(inArray(chatConversationMembersTable.conversationId, [WITH_MAX, WITHOUT_LENA]))
  })

  it('hands a member a message of their conversation, with its text', async () => {
    const found = await dbSelectChatMessageForMember(lenas.messageUuid, LENA)
    expect(found).toEqual({ success: true, value: lenas })
    expect(found.success && found.value.body).toBe('Max to Lena')
  })

  it('hands out nothing of a conversation the member is not in', async () => {
    expect((await dbSelectChatMessageForMember(othersOnly.messageUuid, LENA)).success).toBe(false)
  })

  it('hands out nothing of a message marked deleted', async () => {
    expect((await dbSelectChatMessageForMember(deleted.messageUuid, LENA)).success).toBe(false)
  })

  it('hands out nothing for a uuid without a row', async () => {
    expect((await dbSelectChatMessageForMember(uuidv4(), LENA)).success).toBe(false)
  })

  it('finds the message whatever the case of the uuid and the member, as the columns compare', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: LENA.gradidoId.toUpperCase() }
    const found = await dbSelectChatMessageForMember(lenas.messageUuid.toUpperCase(), shouting)
    expect(found.success && found.value.id).toBe(lenas.id)
  })

  it('files and hands back the first writer of a forwarded copy, and none for any other message', async () => {
    expect(forwarded.forwardedFromCommunityUuid).toBe(NIKO.communityUuid)
    expect(forwarded.forwardedFromGradidoId).toBe(NIKO.gradidoId)
    expect(lenas.forwardedFromCommunityUuid).toBeNull()
    expect(lenas.forwardedFromGradidoId).toBeNull()
  })
})

/**
 * Changing the text of a message (E-060, migration 0151): its writer only, while it is not marked
 * deleted, and never a forwarded copy -- stamped with the database's clock.
 */
describe('dbUpdateChatMessageBody', () => {
  const pair = (): ChatMemberRef => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const LENA = pair()
  const MAX = pair()
  const WITH_MAX = 851
  let lenas: ChatMessageSelect
  let maxs: ChatMessageSelect
  let deleted: ChatMessageSelect
  let forwarded: ChatMessageSelect

  const filed = async (row: ChatMessageInsert): Promise<ChatMessageSelect> => {
    const stored = await dbInsertChatMessage(row)
    if (!stored.success) {
      throw new Error(`fixture: "${row.body}" was not filed`)
    }
    return stored.value
  }
  const from = (sender: ChatMemberRef, body: string, rest = {}) =>
    message(uuidv4(), {
      conversationId: WITH_MAX,
      senderCommunityUuid: sender.communityUuid,
      senderGradidoId: sender.gradidoId,
      body,
      ...rest,
    })
  const rowOf = async (stored: ChatMessageSelect): Promise<ChatMessageSelect> => {
    const [row] = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, stored.id))
    return row
  }
  /** The clock a change is stamped with, as the beat reads it. */
  const clock = async (): Promise<Date> => (await dbSelectChatUnreadSummary(LENA)).now

  beforeAll(async () => {
    lenas = await filed(from(LENA, 'Lena to Max'))
    maxs = await filed(from(MAX, 'Max to Lena'))
    deleted = await filed(from(LENA, 'Lena to Max, deleted later'))
    forwarded = await filed(
      from(LENA, 'Max wrote this', {
        forwardedFromCommunityUuid: MAX.communityUuid,
        forwardedFromGradidoId: MAX.gradidoId,
      }),
    )
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, deleted.id))
    deleted = await rowOf(deleted)
  })

  it('files a message without a moment of change', () => {
    expect(lenas.editedAt).toBeNull()
  })

  it('changes the text for its writer, stamps the moment, and hands back the row as it stands', async () => {
    const before = await clock()
    const changed = await dbUpdateChatMessageBody(lenas.messageUuid, LENA, 'Lena to Max, at eleven')
    const after = await clock()

    expect(changed.success).toBe(true)
    if (!changed.success) {
      return
    }
    // The subject and everything else on the row stay as they were.
    expect(changed.value).toEqual({
      ...lenas,
      body: 'Lena to Max, at eleven',
      editedAt: expect.any(Date),
    })
    expect(changed.value.subject).toBe('About Saturday')
    expect(await rowOf(lenas)).toEqual(changed.value)
    // By the clock the beat asks from: neither before the reading in front of the change, nor
    // after the one behind it.
    const at = changed.value.editedAt?.getTime() ?? 0
    expect(at).toBeGreaterThanOrEqual(before.getTime())
    expect(at).toBeLessThanOrEqual(after.getTime())
  })

  // FOUND_ROWS: the matched row counts, not a changed one. Whether the same text is a change is
  // the caller's to decide before it asks.
  it('takes the same text again as a change, and moves the moment', async () => {
    const long = new Date('2026-09-30T12:00:00.000Z')
    await db
      .update(chatMessagesTable)
      .set({ editedAt: long })
      .where(eq(chatMessagesTable.id, lenas.id))

    const again = await dbUpdateChatMessageBody(lenas.messageUuid, LENA, 'Lena to Max, at eleven')

    expect(again.success && again.value.body).toBe('Lena to Max, at eleven')
    expect(again.success && again.value.editedAt && again.value.editedAt > long).toBe(true)
  })

  it('takes an empty text: a caption may go where the picture stays', async () => {
    const emptied = await dbUpdateChatMessageBody(lenas.messageUuid, LENA, '')
    expect(emptied.success && emptied.value.body).toBe('')
  })

  // ⛔ The pair is part of the where clause: a caller naming somebody else changes nothing.
  it("changes nothing of somebody else's message", async () => {
    for (const notTheWriter of [LENA, { communityUuid: uuidv4(), gradidoId: MAX.gradidoId }]) {
      const refused = await dbUpdateChatMessageBody(maxs.messageUuid, notTheWriter, 'not mine')
      expect(refused.success).toBe(false)
      if (!refused.success) {
        expect(refused.error.name).toBe('DBNotFoundError')
      }
    }
    expect(await rowOf(maxs)).toEqual(maxs)
  })

  it('changes nothing of a message marked deleted', async () => {
    expect((await dbUpdateChatMessageBody(deleted.messageUuid, LENA, 'back again')).success).toBe(
      false,
    )
    expect(await rowOf(deleted)).toEqual(deleted)
  })

  // E-059: the words of a forwarded copy are somebody else's.
  it('changes nothing of a forwarded copy', async () => {
    expect((await dbUpdateChatMessageBody(forwarded.messageUuid, LENA, 'my words')).success).toBe(
      false,
    )
    expect(await rowOf(forwarded)).toEqual(forwarded)
  })

  it('reports a uuid without a row as not found', async () => {
    const result = await dbUpdateChatMessageBody(uuidv4(), LENA, 'nothing there')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.name).toBe('DBNotFoundError')
    }
  })

  it('finds the message whatever the case of the uuid and the writer, as the columns compare', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: MAX.gradidoId.toUpperCase() }
    const changed = await dbUpdateChatMessageBody(
      maxs.messageUuid.toUpperCase(),
      shouting,
      'Max to Lena, louder',
    )
    expect(changed.success && changed.value.id).toBe(maxs.id)
    expect(changed.success && changed.value.body).toBe('Max to Lena, louder')
  })
})

/**
 * What was changed for one member, across every conversation the member is in (E-060): after a
 * place in the order of the changes -- the moment, and within it the id. Its own people, with
 * pairs made for this block, as for dbSelectChatMessagesSince.
 */
describe('dbSelectChatMessagesEditedAfter', () => {
  const pair = (): ChatMemberRef => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const LENA = pair()
  const MAX = pair()
  const NIKO = pair()
  const OTTO = pair()
  // Lena and Max; a group of Lena, Niko and Otto; and Max and Niko, which Lena is not in.
  const WITH_MAX = 861
  const GROUP = 862
  const WITHOUT_LENA = 863
  // Moments of a day long past: one test below asks from the database's own clock on, and must
  // find none of these there.
  const at = (second: number, ms = 0) => new Date(Date.UTC(2026, 8, 1, 9, 0, second, ms))
  // The messages in the order they arrive: conversation, sender, text, and when the text was
  // changed -- not in the order they arrived, the oldest of them last.
  const ARRIVALS: [number, ChatMemberRef, string, Date | null][] = [
    [WITH_MAX, LENA, 'Lena to Max', at(40)],
    [WITHOUT_LENA, MAX, 'Max to Niko', at(15)],
    [GROUP, NIKO, 'Niko to the group', at(20)],
    [WITH_MAX, MAX, 'Max to Lena, never changed', null],
    [GROUP, LENA, 'Lena to the group, deleted later', at(25)],
    [GROUP, OTTO, 'Otto to the group', at(10)],
    [WITH_MAX, MAX, 'Max to Lena, in the same moment as Niko', at(20)],
  ]
  let filed: ChatMessageSelect[]

  const bodiesOf = (messages: ChatMessageSelect[]) => messages.map((m) => m.body)
  /** After every message changed before `moment`, and before every one changed at it. */
  const from = (moment: Date, limit = 50) =>
    dbSelectChatMessagesEditedAfter(LENA, { after: { editedAt: moment, id: 0 }, limit })
  /** Exactly after one message. */
  const after = (message: ChatMessageSelect, limit = 50) =>
    dbSelectChatMessagesEditedAfter(LENA, {
      after: { editedAt: message.editedAt as Date, id: message.id },
      limit,
    })

  beforeAll(async () => {
    await dbInsertChatConversationMembers(WITH_MAX, [LENA, MAX])
    await dbInsertChatConversationMembers(GROUP, [LENA, NIKO, OTTO])
    await dbInsertChatConversationMembers(WITHOUT_LENA, [MAX, NIKO])
    filed = []
    for (const [conversationId, sender, body, editedAt] of ARRIVALS) {
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
      if (editedAt) {
        await db
          .update(chatMessagesTable)
          .set({ editedAt })
          .where(eq(chatMessagesTable.id, stored.value.id))
      }
    }
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, filed[4].id))
  })

  afterAll(async () => {
    await db
      .delete(chatConversationMembersTable)
      .where(inArray(chatConversationMembersTable.conversationId, [WITH_MAX, GROUP, WITHOUT_LENA]))
  })

  it('hands out what was changed in every conversation the member is in, in the order it was changed', async () => {
    const changes = await from(at(0))
    expect(bodiesOf(changes.messages)).toEqual([
      'Otto to the group',
      'Niko to the group',
      'Max to Lena, in the same moment as Niko',
      'Lena to Max',
    ])
    expect(changes.messages.map((m) => m.editedAt)).toEqual([at(10), at(20), at(20), at(40)])
    expect(changes.hasMore).toBe(false)
  })

  // Two changed in the same millisecond: the one that arrived first comes first, on every call.
  it('orders what was changed in the same moment by the order of arrival', async () => {
    const [niko, max] = (await from(at(20))).messages
    expect([niko.id, max.id]).toEqual([filed[2].id, filed[6].id])
    expect(niko.id).toBeLessThan(max.id)
  })

  it('never hands out a message nobody changed', async () => {
    expect(bodiesOf((await from(at(0))).messages)).not.toContain('Max to Lena, never changed')
  })

  it('never hands out a message of a conversation the member is not in', async () => {
    expect(bodiesOf((await from(at(0))).messages)).not.toContain('Max to Niko')
    // Max gets it: he is in that conversation -- and in Lena's, but not in the group.
    const maxs = await dbSelectChatMessagesEditedAfter(MAX, {
      after: { editedAt: at(0), id: 0 },
      limit: 50,
    })
    expect(bodiesOf(maxs.messages)).toEqual([
      'Max to Niko',
      'Max to Lena, in the same moment as Niko',
      'Lena to Max',
    ])
  })

  // A second device or tab of the same person learns what was changed elsewhere.
  it("hands out the member's own changed messages as well", async () => {
    const own = (await from(at(0))).messages.filter((m) => m.senderGradidoId === LENA.gradidoId)
    expect(bodiesOf(own)).toEqual(['Lena to Max'])
  })

  it('leaves out a message marked deleted', async () => {
    expect(bodiesOf((await from(at(0))).messages)).not.toContain('Lena to the group, deleted later')
  })

  // With an id of 0 the whole moment counts: the beat goes back to a settled moment, and a
  // message changed in that very millisecond must not be passed over.
  it('takes in what was changed at the very moment it is asked from, and nothing before it', async () => {
    expect(bodiesOf((await from(at(20))).messages)).toEqual([
      'Niko to the group',
      'Max to Lena, in the same moment as Niko',
      'Lena to Max',
    ])
    expect(bodiesOf((await from(at(20, 1))).messages)).toEqual(['Lena to Max'])
    expect(bodiesOf((await from(at(40))).messages)).toEqual(['Lena to Max'])
    expect(await from(at(40, 1))).toEqual({ messages: [], hasMore: false })
  })

  // ⛔ Within a moment the id counts: after Niko's message come the other one of that
  // millisecond and what was changed later -- not Niko's once more, and not Max's passed over.
  it('goes on exactly after one message, also within its own moment', async () => {
    const [otto, niko, max, lena] = (await from(at(0))).messages
    expect(bodiesOf((await after(otto)).messages)).toEqual([
      'Niko to the group',
      'Max to Lena, in the same moment as Niko',
      'Lena to Max',
    ])
    expect(bodiesOf((await after(niko)).messages)).toEqual([
      'Max to Lena, in the same moment as Niko',
      'Lena to Max',
    ])
    expect(bodiesOf((await after(max)).messages)).toEqual(['Lena to Max'])
    expect(await after(lena)).toEqual({ messages: [], hasMore: false })
  })

  it('caps the answer, says there is more exactly when one did not fit, and goes on from there', async () => {
    const first = await from(at(0), 2)
    expect(bodiesOf(first.messages)).toEqual(['Otto to the group', 'Niko to the group'])
    expect(first.hasMore).toBe(true)

    // After the last one handed out: the cap cut between two of one millisecond, and the other
    // of the two comes first -- every message once.
    const second = await after(first.messages[1], 2)
    expect(bodiesOf(second.messages)).toEqual([
      'Max to Lena, in the same moment as Niko',
      'Lena to Max',
    ])
    expect(second.hasMore).toBe(false)

    const oneShort = await after(first.messages[1], 1)
    expect(bodiesOf(oneShort.messages)).toEqual(['Max to Lena, in the same moment as Niko'])
    expect(oneShort.hasMore).toBe(true)
  })

  // The two clocks are one: what dbUpdateChatMessageBody stamps is found from the moment
  // dbSelectChatUnreadSummary read just before it.
  it('finds a change from the moment the clock was read before it', async () => {
    const { now } = await dbSelectChatUnreadSummary(LENA)
    const changed = await dbUpdateChatMessageBody(filed[3].messageUuid, MAX, 'Max to Lena, changed')
    expect(changed.success).toBe(true)

    const found = await from(now)
    expect(bodiesOf(found.messages)).toEqual(['Max to Lena, changed'])
    expect(found.messages[0].id).toBe(filed[3].id)
    // And not after itself.
    expect(await after(found.messages[0])).toEqual({ messages: [], hasMore: false })
  })

  it('answers the same for the member named in capitals, as the column compares', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: LENA.gradidoId.toUpperCase() }
    expect(
      await dbSelectChatMessagesEditedAfter(shouting, {
        after: { editedAt: at(0), id: 0 },
        limit: 50,
      }),
    ).toEqual(await from(at(0)))
  })

  it('answers nothing for somebody in no conversation', async () => {
    expect(
      await dbSelectChatMessagesEditedAfter(pair(), {
        after: { editedAt: at(0), id: 0 },
        limit: 50,
      }),
    ).toEqual({ messages: [], hasMore: false })
  })

  it('refuses a cap below one, a moment that is none and an id below zero', async () => {
    await expect(from(at(0), 0)).rejects.toThrow('page size')
    await expect(from(new Date('no moment'))).rejects.toThrow('not a moment')
    await expect(
      dbSelectChatMessagesEditedAfter(LENA, { after: { editedAt: at(0), id: -1 }, limit: 50 }),
    ).rejects.toThrow('message id')
  })
})

/**
 * Where the reactions changed for one member (migration 0158): the stamp a reaction leaves on its
 * message, and the read by that stamp. The read is the one behind dbSelectChatMessagesEditedAfter
 * -- its order, its cap and its going on are held there; here, that it goes by the OTHER clock,
 * and who may leave the stamp.
 */
describe('dbUpdateChatMessageReactedAt and dbSelectChatMessagesReactedAfter', () => {
  const pair = (): ChatMemberRef => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const LENA = pair()
  const MAX = pair()
  const NIKO = pair()
  // Lena and Max; and Max and Niko, which Lena is not in.
  const WITH_MAX = 871
  const WITHOUT_LENA = 872
  const at = (second: number, ms = 0) => new Date(Date.UTC(2026, 8, 2, 9, 0, second, ms))
  // The messages in the order they arrive: conversation, sender, text, when the reactions to it
  // changed, and when its text was -- the two clocks set apart, so that a read by the wrong one
  // hands out another order.
  const ARRIVALS: [number, ChatMemberRef, string, Date | null, Date | null][] = [
    [WITH_MAX, LENA, 'Lena to Max, reacted to last', at(40), at(5)],
    [WITHOUT_LENA, MAX, 'Max to Niko, reacted to', at(15), null],
    [WITH_MAX, MAX, 'Max to Lena, text changed only', null, at(30)],
    [WITH_MAX, MAX, 'Max to Lena, reacted to first', at(10), at(50)],
    [WITH_MAX, LENA, 'Lena to Max, deleted later', at(20), null],
    [WITH_MAX, MAX, 'Max to Lena, in the same moment', at(40), null],
    [WITH_MAX, MAX, 'Max to Lena, untouched', null, null],
  ]
  let filed: ChatMessageSelect[]

  const bodiesOf = (messages: ChatMessageSelect[]) => messages.map((m) => m.body)
  const from = (moment: Date, member = LENA, limit = 50) =>
    dbSelectChatMessagesReactedAfter(member, { after: { editedAt: moment, id: 0 }, limit })
  const rowOf = async (id: number): Promise<ChatMessageSelect> => {
    const rows = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, id))
    return rows[0]
  }

  beforeAll(async () => {
    await dbInsertChatConversationMembers(WITH_MAX, [LENA, MAX])
    await dbInsertChatConversationMembers(WITHOUT_LENA, [MAX, NIKO])
    filed = []
    for (const [conversationId, sender, body, reactedAt, editedAt] of ARRIVALS) {
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
      if (reactedAt || editedAt) {
        await db
          .update(chatMessagesTable)
          .set({ reactedAt, editedAt })
          .where(eq(chatMessagesTable.id, stored.value.id))
      }
    }
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, filed[4].id))
  })

  afterAll(async () => {
    await db
      .delete(chatConversationMembersTable)
      .where(inArray(chatConversationMembersTable.conversationId, [WITH_MAX, WITHOUT_LENA]))
  })

  it('files a message without a moment of reactions', () => {
    expect(filed[6].reactedAt).toBeNull()
  })

  // ⛔ By `reacted_at`, not by `edited_at`: read by the text's clock, the first message would
  // come first and the one whose text alone was changed would be among them.
  it('hands out the messages whose reactions changed, in the order that happened', async () => {
    const changes = await from(at(0))
    expect(bodiesOf(changes.messages)).toEqual([
      'Max to Lena, reacted to first',
      'Lena to Max, reacted to last',
      'Max to Lena, in the same moment',
    ])
    expect(changes.messages.map((m) => m.reactedAt)).toEqual([at(10), at(40), at(40)])
    expect(changes.hasMore).toBe(false)
  })

  it('never hands out a message whose text alone was changed, or one nobody touched', async () => {
    const bodies = bodiesOf((await from(at(0))).messages)
    expect(bodies).not.toContain('Max to Lena, text changed only')
    expect(bodies).not.toContain('Max to Lena, untouched')
  })

  it('never hands out a message of a conversation the member is not in', async () => {
    expect(bodiesOf((await from(at(0))).messages)).not.toContain('Max to Niko, reacted to')
    // Niko gets it, and nothing of the conversation of Lena and Max.
    expect(bodiesOf((await from(at(0), NIKO)).messages)).toEqual(['Max to Niko, reacted to'])
  })

  it('leaves out a message marked deleted', async () => {
    expect(bodiesOf((await from(at(0))).messages)).not.toContain('Lena to Max, deleted later')
  })

  it('goes on exactly after one message, also within its own moment, and caps the answer', async () => {
    const [first, lena, max] = (await from(at(0))).messages
    const after = (message: ChatMessageSelect, limit = 50) =>
      dbSelectChatMessagesReactedAfter(LENA, {
        after: { editedAt: message.reactedAt as Date, id: message.id },
        limit,
      })
    expect(bodiesOf((await after(first)).messages)).toEqual([
      'Lena to Max, reacted to last',
      'Max to Lena, in the same moment',
    ])
    expect(bodiesOf((await after(lena)).messages)).toEqual(['Max to Lena, in the same moment'])
    expect(await after(max)).toEqual({ messages: [], hasMore: false })

    const capped = await from(at(0), LENA, 2)
    expect(bodiesOf(capped.messages)).toEqual([
      'Max to Lena, reacted to first',
      'Lena to Max, reacted to last',
    ])
    expect(capped.hasMore).toBe(true)
  })

  it('refuses a cap below one, a moment that is none and an id below zero, under its own name', async () => {
    await expect(from(at(0), LENA, 0)).rejects.toThrow(
      'dbSelectChatMessagesReactedAfter: 0 is not a page size',
    )
    await expect(from(new Date('no moment'))).rejects.toThrow('not a moment')
    await expect(
      dbSelectChatMessagesReactedAfter(LENA, { after: { editedAt: at(0), id: -1 }, limit: 50 }),
    ).rejects.toThrow('message id')
  })

  // The two clocks are one: what the stamp writes is found from the moment
  // dbSelectChatUnreadSummary read just before it -- and it moves nothing else on the row.
  it('stamps a message for a member of its conversation, by the clock the beat reads', async () => {
    const before = await rowOf(filed[6].id)
    const { now } = await dbSelectChatUnreadSummary(LENA)

    expect(await dbUpdateChatMessageReactedAt(filed[6].id, LENA)).toEqual({ success: true })

    const stamped = await rowOf(filed[6].id)
    expect(stamped.reactedAt).toBeInstanceOf(Date)
    expect((stamped.reactedAt as Date).getTime()).toBeGreaterThanOrEqual(now.getTime())
    expect({ ...stamped, reactedAt: null }).toEqual(before)
    const found = await from(now)
    expect(bodiesOf(found.messages)).toEqual(['Max to Lena, untouched'])
    // Max, the other member of that conversation, is told as well.
    expect(bodiesOf((await from(now, MAX)).messages)).toEqual(['Max to Lena, untouched'])
  })

  it('stamps again for the next change, later than before', async () => {
    const first = (await rowOf(filed[6].id)).reactedAt as Date
    expect(await dbUpdateChatMessageReactedAt(filed[6].id, MAX)).toEqual({ success: true })
    expect(((await rowOf(filed[6].id)).reactedAt as Date).getTime()).toBeGreaterThan(
      first.getTime(),
    )
  })

  // ⛔ The rule is in the statement: somebody who is not in the conversation leaves no stamp.
  it('stamps nothing for somebody who is not in the conversation of the message', async () => {
    const before = await rowOf(filed[3].id)
    const refused = await dbUpdateChatMessageReactedAt(filed[3].id, NIKO)
    expect(refused.success).toBe(false)
    expect(!refused.success && refused.error.name).toBe('DBNotFoundError')
    expect(await rowOf(filed[3].id)).toEqual(before)
    // Not for somebody in no conversation at all either.
    expect((await dbUpdateChatMessageReactedAt(filed[3].id, pair())).success).toBe(false)
    expect(await rowOf(filed[3].id)).toEqual(before)
  })

  it('stamps nothing on a message marked deleted, and reports an id without a row', async () => {
    const before = await rowOf(filed[4].id)
    expect((await dbUpdateChatMessageReactedAt(filed[4].id, LENA)).success).toBe(false)
    expect(await rowOf(filed[4].id)).toEqual(before)
    expect((await dbUpdateChatMessageReactedAt(4_000_000_000, LENA)).success).toBe(false)
  })

  it('finds the member whatever the case of the pair, as the columns compare', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: MAX.gradidoId.toUpperCase() }
    expect(await dbUpdateChatMessageReactedAt(filed[3].id, shouting)).toEqual({ success: true })
  })

  /**
   * ⛔ Always later than the moment the row had (11.10.2026). The clock the statement reads is
   * the moment it began, not the moment it got the row: with two members in one millisecond, or
   * with a clock set back, a later state of the reactions had the same moment as the one before
   * it, or an earlier one -- and a wallet passes over what is earlier than what it holds.
   */
  it('stamps a moment later than the one the message had, whatever the clock says', async () => {
    // A moment the clock has not reached: an hour ahead, as it is after a clock was set back.
    const ahead = new Date(Math.floor(Date.now() / 1000) * 1000 + 3_600_123)
    await db
      .update(chatMessagesTable)
      .set({ reactedAt: ahead })
      .where(eq(chatMessagesTable.id, filed[6].id))

    expect(await dbUpdateChatMessageReactedAt(filed[6].id, LENA)).toEqual({ success: true })
    expect((await rowOf(filed[6].id)).reactedAt).toEqual(new Date(ahead.getTime() + 1))

    expect(await dbUpdateChatMessageReactedAt(filed[6].id, MAX)).toEqual({ success: true })
    expect((await rowOf(filed[6].id)).reactedAt).toEqual(new Date(ahead.getTime() + 2))
  })

  it('gives each of many stamps in a row a moment of its own, later than the one before', async () => {
    const moments: number[] = []
    for (let i = 0; i < 25; i++) {
      expect((await dbUpdateChatMessageReactedAt(filed[3].id, i % 2 ? LENA : MAX)).success).toBe(
        true,
      )
      moments.push(((await rowOf(filed[3].id)).reactedAt as Date).getTime())
    }
    expect(moments.filter((moment, i) => i > 0 && moment <= moments[i - 1])).toEqual([])
  })
})

/**
 * What the answers on a page quote (migration 0157): the quoted messages by their uuids, in one
 * query -- and the column an answer carries.
 */
describe('dbSelectChatMessagesByUuids', () => {
  const QUOTING = 861
  const pair = (): ChatMemberRef => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const OLGA = pair()
  // With letters in both cases: the column compares without regard to case.
  const QUOTED = 'abcdef00-0000-4000-8000-00000000aa01'
  const QUOTED_TOO = 'ABCDEF00-0000-4000-8000-00000000AA02'
  const DELETED = 'abcdef00-0000-4000-8000-00000000aa03'
  const ANSWER = 'abcdef00-0000-4000-8000-00000000aa04'
  const NOBODYS = 'abcdef00-0000-4000-8000-00000000aa09'

  const from = (messageUuid: string, body: string, rest: Partial<ChatMessageInsert> = {}) =>
    message(messageUuid, {
      conversationId: QUOTING,
      senderCommunityUuid: OLGA.communityUuid,
      senderGradidoId: OLGA.gradidoId,
      subject: null,
      body,
      ...rest,
    })

  beforeAll(async () => {
    for (const row of [
      from(QUOTED, 'the first quoted'),
      from(QUOTED_TOO, 'the second quoted'),
      from(DELETED, 'quoted, deleted later'),
      from(ANSWER, 'an answer', { replyToMessageUuid: QUOTED }),
    ]) {
      const stored = await dbInsertChatMessage(row)
      if (!stored.success) {
        throw new Error(`fixture: "${row.body}" was not filed`)
      }
    }
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.messageUuid, DELETED))
  })
  afterAll(async () => {
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.conversationId, QUOTING))
  })

  const bodies = async (uuids: string[]) =>
    (await dbSelectChatMessagesByUuids(uuids)).map((row) => row.body).sort()

  it('hands back the messages named, each once, and no other', async () => {
    expect(await bodies([QUOTED, QUOTED_TOO, QUOTED])).toEqual([
      'the first quoted',
      'the second quoted',
    ])
    expect(await bodies([QUOTED])).toEqual(['the first quoted'])
  })

  it('finds a message whatever the case its uuid is asked in', async () => {
    expect(await bodies([QUOTED.toUpperCase()])).toEqual(['the first quoted'])
    expect(await bodies([QUOTED_TOO.toLowerCase()])).toEqual(['the second quoted'])
  })

  it('leaves out a message marked deleted, and a uuid nothing is filed under', async () => {
    expect(await bodies([DELETED, NOBODYS])).toEqual([])
    expect(await bodies([DELETED, QUOTED_TOO])).toEqual(['the second quoted'])
  })

  it('asks nothing for an empty list', async () => {
    expect(await dbSelectChatMessagesByUuids([])).toEqual([])
  })

  it('files what a message answers with it, and nothing on every other message', async () => {
    const [answer] = await dbSelectChatMessagesByUuids([ANSWER])
    expect(answer.replyToMessageUuid).toBe(QUOTED)
    const [quoted] = await dbSelectChatMessagesByUuids([QUOTED])
    expect(quoted.replyToMessageUuid).toBeNull()
  })
})
