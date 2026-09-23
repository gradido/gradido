// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { v4 as uuidv4 } from 'uuid'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { chatConversationMembersTable, chatConversationsTable } from '../schemas'
import {
  dbEnsureDirectChatConversation,
  dbFindDirectChatConversation,
  directChatPairKey,
} from './chatConversations'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Pairs only: the tables carry no foreign key, so no users rows are needed.
const HOME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const ANNA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
const BEN = { communityUuid: HOME, gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }
// Anna's gradido id in another community: another person.
const ANNA_OVER_THERE = { communityUuid: OTHER, gradidoId: ANNA.gradidoId }

const membersOf = (conversationId: number) =>
  db
    .select()
    .from(chatConversationMembersTable)
    .where(eq(chatConversationMembersTable.conversationId, conversationId))

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(chatConversationMembersTable)
  await db.delete(chatConversationsTable)
})
afterAll(async () => {
  await db.delete(chatConversationMembersTable)
  await db.delete(chatConversationsTable)
  await appDB.destroy()
})

describe('directChatPairKey', () => {
  it('joins both members as community/member, sorted, with a bar between them', () => {
    expect(directChatPairKey(ANNA, BEN)).toBe(`${HOME}/${ANNA.gradidoId}|${HOME}/${BEN.gradidoId}`)
  })

  it('gives the same key in either order', () => {
    expect(directChatPairKey(BEN, ANNA)).toBe(directChatPairKey(ANNA, BEN))
    expect(directChatPairKey(ANNA_OVER_THERE, ANNA)).toBe(directChatPairKey(ANNA, ANNA_OVER_THERE))
  })

  // The column compares without regard to case, a JavaScript sort does not: the same uuid in
  // capitals must neither sort to the other side nor make another key.
  it('reads a uuid in capitals as the same uuid', () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: BEN.gradidoId.toUpperCase() }
    expect(directChatPairKey(ANNA, shouting)).toBe(directChatPairKey(ANNA, BEN))
    expect(directChatPairKey(shouting, ANNA)).toBe(directChatPairKey(ANNA, BEN))
  })

  it('keeps members of different communities apart by the whole pair', () => {
    expect(directChatPairKey(ANNA_OVER_THERE, BEN)).not.toBe(directChatPairKey(ANNA, BEN))
  })
})

describe('chatConversations query test', () => {
  it('finds nothing for a pair without a conversation', async () => {
    expect(await dbFindDirectChatConversation(ANNA, BEN)).toBeNull()
  })

  it('opens a direct conversation with both members in it', async () => {
    const conversation = await dbEnsureDirectChatConversation(ANNA, BEN)
    expect(conversation).toMatchObject({
      kind: 'direct',
      directPairKey: directChatPairKey(ANNA, BEN),
      homeCommunityUuid: null,
      title: null,
      createdByCommunityUuid: ANNA.communityUuid,
      createdByGradidoId: ANNA.gradidoId,
    })
    expect(conversation.conversationUuid).toMatch(/^[0-9a-f-]{36}$/)
    expect(conversation.createdAt).toBeInstanceOf(Date)

    const members = await membersOf(conversation.id)
    expect(members.map((m) => `${m.communityUuid}/${m.gradidoId}`).sort()).toEqual(
      [`${HOME}/${ANNA.gradidoId}`, `${HOME}/${BEN.gradidoId}`].sort(),
    )
    for (const member of members) {
      expect(member).toMatchObject({ role: 'member', lastReadMessageId: null, mutedAt: null })
    }
  })

  it('finds the same conversation for the pair in both orders', async () => {
    const one = await dbFindDirectChatConversation(ANNA, BEN)
    const other = await dbFindDirectChatConversation(BEN, ANNA)
    expect(one).not.toBeNull()
    expect(other?.id).toBe(one?.id)
  })

  it('keeps one conversation and two members however often and from whichever side', async () => {
    const first = await dbFindDirectChatConversation(ANNA, BEN)
    const again = await dbEnsureDirectChatConversation(ANNA, BEN)
    const answer = await dbEnsureDirectChatConversation(BEN, ANNA)

    expect(again.id).toBe(first?.id)
    expect(answer.id).toBe(first?.id)
    // Whoever wrote first opened it; an answer does not take that over.
    expect(answer.createdByGradidoId).toBe(ANNA.gradidoId)
    expect(await db.select().from(chatConversationsTable)).toHaveLength(1)
    expect(await membersOf(answer.id)).toHaveLength(2)
  })

  // Two first messages at the same moment, one from each side: the unique key on the pair
  // key keeps them to one conversation, and a statement per member keeps the two inserts of
  // the same members in opposite order from deadlocking (database CI, 23.09.2026). A race
  // that was lost once in seven runs needs more than one chance, so twenty more pairs follow.
  it('opens one conversation for two first messages written at the same moment', async () => {
    const pairs = [
      [ANNA_OVER_THERE, BEN],
      ...Array.from({ length: 20 }, () => [
        { communityUuid: OTHER, gradidoId: uuidv4() },
        { communityUuid: HOME, gradidoId: uuidv4() },
      ]),
    ]
    for (const [left, right] of pairs) {
      const [one, other] = await Promise.all([
        dbEnsureDirectChatConversation(left, right),
        dbEnsureDirectChatConversation(right, left),
      ])
      expect(other.id).toBe(one.id)
      expect(
        await db
          .select()
          .from(chatConversationsTable)
          .where(eq(chatConversationsTable.directPairKey, directChatPairKey(left, right))),
      ).toHaveLength(1)
      expect(await membersOf(one.id)).toHaveLength(2)
    }
  })

  it('opens another conversation for another pair', async () => {
    const withAnna = await dbFindDirectChatConversation(ANNA, BEN)
    const withAnnaOverThere = await dbFindDirectChatConversation(ANNA_OVER_THERE, BEN)
    expect(withAnnaOverThere?.id).not.toBe(withAnna?.id)
  })

  it('completes the members of a conversation that lost them', async () => {
    const conversation = await dbEnsureDirectChatConversation(ANNA, BEN)
    await db
      .delete(chatConversationMembersTable)
      .where(eq(chatConversationMembersTable.conversationId, conversation.id))

    await dbEnsureDirectChatConversation(BEN, ANNA)

    expect(await membersOf(conversation.id)).toHaveLength(2)
  })

  it('finds the conversation under a uuid written in capitals', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: BEN.gradidoId.toUpperCase() }
    const conversation = await dbFindDirectChatConversation(ANNA, BEN)
    expect((await dbFindDirectChatConversation(shouting, ANNA))?.id).toBe(conversation?.id)
    expect((await dbEnsureDirectChatConversation(shouting, ANNA)).id).toBe(conversation?.id)
  })
})
