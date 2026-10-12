// AI-GENERATED — not an architecture reference
import { eq, inArray, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import {
  chatConversationMembersTable,
  chatMessageReactionsTable,
  chatMessagesTable,
} from '../schemas'
import { ChatMemberRef, dbInsertChatConversationMembers } from './chatConversationMembers'
import {
  dbDeleteChatMessageReaction,
  dbSelectChatMessageReactions,
  dbUpsertChatMessageReaction,
} from './chatMessageReactions'
import { dbInsertChatMessage, dbUpdateChatMessageReactedAt } from './chatMessages'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No foreign keys: a conversation id and the pairs of its members are all the rows need.
const CONVERSATION = 9201
const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA: ChatMemberRef = {
  communityUuid: HOME,
  gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}
const BEN: ChatMemberRef = {
  communityUuid: HOME,
  gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
}
const CARL: ChatMemberRef = {
  communityUuid: HOME,
  gradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
}

const FIRST = '50000000-0000-4000-8000-000000000001'
const SECOND = '50000000-0000-4000-8000-000000000002'
const UNTOUCHED = '50000000-0000-4000-8000-000000000003'
const MESSAGES = [FIRST, SECOND, UNTOUCHED]

const THUMB = '👍'
const SEEDLING = '🌱'
// With the selector that asks for the coloured drawing: two code points, one sign.
const HEART = '❤️'

let first: number
let second: number
let untouched: number

const fileMessage = async (messageUuid: string): Promise<number> => {
  const filed = await dbInsertChatMessage({
    messageUuid,
    conversationId: CONVERSATION,
    senderCommunityUuid: HOME,
    senderGradidoId: ANNA.gradidoId,
    subject: null,
    body: 'Shall we meet at ten?',
    notify: 'none',
    deliveryState: 'delivered',
  })
  if (!filed.success) {
    throw new Error(`could not file the message ${messageUuid}`)
  }
  return filed.value.id
}

/** The reactions to a message as a test reads them: who, and with what, in their order. */
const reactionsTo = async (...messageIds: number[]): Promise<[number, string, string][]> =>
  (await dbSelectChatMessageReactions(messageIds)).map((row) => [
    row.messageId,
    row.gradidoId,
    row.emoji,
  ])

const cleanUp = async (): Promise<void> => {
  await db.delete(chatMessageReactionsTable)
  await db.delete(chatMessagesTable).where(inArray(chatMessagesTable.messageUuid, MESSAGES))
  await db
    .delete(chatConversationMembersTable)
    .where(eq(chatConversationMembersTable.conversationId, CONVERSATION))
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await cleanUp()
  await dbInsertChatConversationMembers(CONVERSATION, [ANNA, BEN, CARL])
  first = await fileMessage(FIRST)
  second = await fileMessage(SECOND)
  untouched = await fileMessage(UNTOUCHED)
})

afterAll(async () => {
  await cleanUp()
  await appDB.destroy()
})

describe('chatMessageReactions', () => {
  it('starts without a reaction', async () => {
    expect(await dbSelectChatMessageReactions([first, second, untouched])).toEqual([])
  })

  it('files the reaction of a member to a message', async () => {
    await dbUpsertChatMessageReaction({ messageId: first, ...BEN, emoji: THUMB })

    const rows = await dbSelectChatMessageReactions([first])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ messageId: first, ...BEN, emoji: THUMB })
    expect(rows[0].createdAt).toBeInstanceOf(Date)
  })

  it('hands back the reactions of several messages in the order the members reacted', async () => {
    await dbUpsertChatMessageReaction({ messageId: second, ...CARL, emoji: HEART })
    await dbUpsertChatMessageReaction({ messageId: first, ...ANNA, emoji: SEEDLING })

    expect(await reactionsTo(second, first)).toEqual([
      [first, BEN.gradidoId, THUMB],
      [second, CARL.gradidoId, HEART],
      [first, ANNA.gradidoId, SEEDLING],
    ])
    // Only the messages asked for, and none for a message nobody reacted to.
    expect(await reactionsTo(second)).toEqual([[second, CARL.gradidoId, HEART]])
    expect(await reactionsTo(untouched)).toEqual([])
  })

  // ⛔ One reaction a member and message: another one takes the place of the first -- its row,
  // and with the row its place among the reactions.
  it('replaces the reaction of a member who reacts again, in its place', async () => {
    const [before] = await dbSelectChatMessageReactions([first])
    await dbUpsertChatMessageReaction({ messageId: first, ...BEN, emoji: HEART })

    const rows = await dbSelectChatMessageReactions([first])
    expect(rows.map((row) => [row.gradidoId, row.emoji])).toEqual([
      [BEN.gradidoId, HEART],
      [ANNA.gradidoId, SEEDLING],
    ])
    expect(rows[0].id).toBe(before.id)
  })

  it('takes the same member for one whatever the case of the pair, as the columns compare', async () => {
    await dbUpsertChatMessageReaction({
      messageId: first,
      communityUuid: HOME.toUpperCase(),
      gradidoId: BEN.gradidoId.toUpperCase(),
      emoji: THUMB,
    })
    expect((await dbSelectChatMessageReactions([first])).map((row) => row.emoji)).toEqual([
      THUMB,
      SEEDLING,
    ])
  })

  // ⛔ Byte by byte: to the tables' own collation a thumb and a seedling are the same character,
  // and to the column they are not.
  it('tells one emoji from another where the database compares them', async () => {
    const [tablesOwn] = await db.execute(
      sql`select ${THUMB} = ${SEEDLING} collate utf8mb4_unicode_ci as same`,
    )
    expect((tablesOwn as unknown as { same: number }[])[0].same).toBe(1)

    const thumbs = await db
      .select({ gradidoId: chatMessageReactionsTable.gradidoId })
      .from(chatMessageReactionsTable)
      .where(eq(chatMessageReactionsTable.emoji, THUMB))
    expect(thumbs).toEqual([{ gradidoId: BEN.gradidoId }])
    const seedlings = await db
      .select({ gradidoId: chatMessageReactionsTable.gradidoId })
      .from(chatMessageReactionsTable)
      .where(eq(chatMessageReactionsTable.emoji, SEEDLING))
    expect(seedlings).toEqual([{ gradidoId: ANNA.gradidoId }])
  })

  it('keeps a sign of two code points whole', async () => {
    const [carls] = await dbSelectChatMessageReactions([second])
    expect(carls.emoji).toBe(HEART)
    expect([...carls.emoji]).toHaveLength(2)
  })

  it('takes a reaction back, and says whether there was one', async () => {
    expect(await dbDeleteChatMessageReaction(first, BEN)).toBe(true)
    expect(await reactionsTo(first)).toEqual([[first, ANNA.gradidoId, SEEDLING]])
    // None left to take back: an answer, not a failure.
    expect(await dbDeleteChatMessageReaction(first, BEN)).toBe(false)
    // And nobody else's goes with it: not the other member's, not the one to another message.
    expect(await reactionsTo(first, second)).toEqual([
      [second, CARL.gradidoId, HEART],
      [first, ANNA.gradidoId, SEEDLING],
    ])
  })

  it('takes a reaction back whatever the case of the pair', async () => {
    expect(
      await dbDeleteChatMessageReaction(first, {
        communityUuid: HOME.toUpperCase(),
        gradidoId: ANNA.gradidoId.toUpperCase(),
      }),
    ).toBe(true)
    expect(await reactionsTo(first)).toEqual([])
  })

  it('asks nothing for an empty list', async () => {
    expect(await dbSelectChatMessageReactions([])).toEqual([])
  })

  // The stamp and the reaction in one transaction, as the backend writes them (chatReaction.ts):
  // both are there afterwards, and neither where the transaction is given up.
  it('is written in the transaction of the stamp on its message, and not without it', async () => {
    await db.transaction(async (tx) => {
      expect((await dbUpdateChatMessageReactedAt(untouched, BEN, tx)).success).toBe(true)
      await dbUpsertChatMessageReaction({ messageId: untouched, ...BEN, emoji: THUMB }, tx)
    })
    expect(await reactionsTo(untouched)).toEqual([[untouched, BEN.gradidoId, THUMB]])

    await expect(
      db.transaction(async (tx) => {
        await dbUpdateChatMessageReactedAt(untouched, BEN, tx)
        expect(await dbDeleteChatMessageReaction(untouched, BEN, tx)).toBe(true)
        throw new Error('given up')
      }),
    ).rejects.toThrow('given up')
    expect(await reactionsTo(untouched)).toEqual([[untouched, BEN.gradidoId, THUMB]])
  })
})
