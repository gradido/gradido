// AI-GENERATED — not an architecture reference
import { and, eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { v4 as uuidv4 } from 'uuid'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { chatConversationMembersTable, chatMessagesTable } from '../schemas'
import {
  dbInsertChatConversationMembers,
  dbSelectChatConversationMember,
  dbUpdateChatConversationMemberLastRead,
  dbUpdateChatConversationMemberMuted,
} from './chatConversationMembers'
import { dbInsertChatMessage } from './chatMessages'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// The table carries no foreign key: a conversation id and two pairs are all it needs.
const CONVERSATION = 4711
const HOME = '11111111-1111-4111-8111-111111111111'
const ANNA = { communityUuid: HOME, gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
const BEN = { communityUuid: HOME, gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }

const members = () =>
  db
    .select()
    .from(chatConversationMembersTable)
    .where(eq(chatConversationMembersTable.conversationId, CONVERSATION))

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(chatConversationMembersTable)
})
afterAll(async () => {
  await db.delete(chatConversationMembersTable)
  await appDB.destroy()
})

describe('chatConversationMembers query test', () => {
  it('starts empty', async () => {
    expect(await members()).toEqual([])
  })

  it('puts both members in, as plain members', async () => {
    await dbInsertChatConversationMembers(CONVERSATION, [ANNA, BEN])
    const rows = await members()
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row).toMatchObject({ role: 'member', lastReadMessageId: null, mutedAt: null })
      expect(row.joinedAt).toBeInstanceOf(Date)
    }
  })

  it('leaves a member who is in already as they are', async () => {
    const annaOnly = and(
      eq(chatConversationMembersTable.conversationId, CONVERSATION),
      eq(chatConversationMembersTable.gradidoId, ANNA.gradidoId),
    )
    const mutedAt = new Date('2026-09-23T12:00:00.000Z')
    await db
      .update(chatConversationMembersTable)
      .set({ role: 'owner', lastReadMessageId: 42, mutedAt })
      .where(annaOnly)
    const [before] = await db.select().from(chatConversationMembersTable).where(annaOnly)

    // Must not throw, must not add a row, must not reset what the member has set.
    await dbInsertChatConversationMembers(CONVERSATION, [ANNA, BEN])

    expect(await members()).toHaveLength(2)
    const [after] = await db.select().from(chatConversationMembersTable).where(annaOnly)
    expect(after.role).toBe('owner')
    expect(after.lastReadMessageId).toBe(42)
    expect(after.mutedAt?.getTime()).toBe(mutedAt.getTime())
    expect(after.joinedAt.getTime()).toBe(before.joinedAt.getTime())
  })
})

describe('dbUpdateChatConversationMemberLastRead', () => {
  const READ = 4712
  const CARL = { communityUuid: HOME, gradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }
  // Five messages of the conversation, in the order they arrived, and one of another.
  let ids: number[]
  let elsewhere: number

  const file = async (conversationId: number): Promise<number> => {
    const stored = await dbInsertChatMessage({
      messageUuid: uuidv4(),
      conversationId,
      senderCommunityUuid: BEN.communityUuid,
      senderGradidoId: BEN.gradidoId,
      subject: null,
      body: 'hello',
      notify: 'email',
      deliveryState: 'delivered',
    })
    if (!stored.success) {
      throw new Error('fixture: a message was not filed')
    }
    return stored.value.id
  }

  const pointerOf = async (member: { communityUuid: string; gradidoId: string }) => {
    const [row] = await db
      .select()
      .from(chatConversationMembersTable)
      .where(
        and(
          eq(chatConversationMembersTable.conversationId, READ),
          eq(chatConversationMembersTable.gradidoId, member.gradidoId),
        ),
      )
    return row?.lastReadMessageId
  }

  beforeAll(async () => {
    await dbInsertChatConversationMembers(READ, [ANNA, BEN])
    ids = []
    for (let n = 0; n < 5; n++) {
      ids.push(await file(READ))
    }
    elsewhere = await file(READ + 2)
  })

  afterAll(async () => {
    await db.delete(chatMessagesTable)
  })

  // GREATEST with a NULL is NULL: without the COALESCE a member who has read nothing yet
  // would stay at nothing.
  it('sets the pointer of a member who has read nothing yet', async () => {
    expect(await pointerOf(ANNA)).toBeNull()
    expect(await dbUpdateChatConversationMemberLastRead(READ, ANNA, ids[1])).toEqual({
      success: true,
    })
    expect(await pointerOf(ANNA)).toBe(ids[1])
  })

  it('moves the pointer up', async () => {
    await dbUpdateChatConversationMemberLastRead(READ, ANNA, ids[3])
    expect(await pointerOf(ANNA)).toBe(ids[3])
  })

  // An older id arriving late -- a second tab, a slow request -- must not make read messages
  // unread again. The same id twice is no change, and still a success (FOUND_ROWS).
  it('never moves the pointer down, and takes an older id as a success', async () => {
    expect(await dbUpdateChatConversationMemberLastRead(READ, ANNA, ids[2])).toEqual({
      success: true,
    })
    expect(await pointerOf(ANNA)).toBe(ids[3])
    expect(await dbUpdateChatConversationMemberLastRead(READ, ANNA, ids[3])).toEqual({
      success: true,
    })
    expect(await pointerOf(ANNA)).toBe(ids[3])
  })

  it("moves only the named member's pointer", async () => {
    expect(await pointerOf(BEN)).toBeNull()
    await dbUpdateChatConversationMemberLastRead(READ, BEN, ids[0])
    expect(await pointerOf(BEN)).toBe(ids[0])
    expect(await pointerOf(ANNA)).toBe(ids[3])
  })

  it('finds a member named in capitals, as the column compares', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: BEN.gradidoId.toUpperCase() }
    expect(await dbUpdateChatConversationMemberLastRead(READ, shouting, ids[1])).toEqual({
      success: true,
    })
    expect(await pointerOf(BEN)).toBe(ids[1])
  })

  it('reports a member who is not in the conversation as not found, and writes no row', async () => {
    const result = await dbUpdateChatConversationMemberLastRead(READ, CARL, ids[4])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.name).toBe('DBNotFoundError')
    }
    expect(await pointerOf(CARL)).toBeUndefined()
    // Nor in a conversation that does not exist.
    const nowhere = await dbUpdateChatConversationMemberLastRead(4713, ANNA, ids[4])
    expect(nowhere.success).toBe(false)
  })

  // ⛔ Message ids are counted across all conversations and the pointer never moves back: an
  // id from elsewhere, or one no message has, would push it past every message to come, and
  // the conversation would show nothing unread for good.
  it('refuses an id of another conversation, and one no message has, and moves nothing', async () => {
    for (const foreign of [elsewhere, ids[4] + 1000]) {
      const result = await dbUpdateChatConversationMemberLastRead(READ, ANNA, foreign)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.name).toBe('DBNotFoundError')
      }
    }
    expect(await pointerOf(ANNA)).toBe(ids[3])
  })

  it('takes a message marked deleted: it had its place when it was shown', async () => {
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessagesTable.id, ids[4]))
    expect(await dbUpdateChatConversationMemberLastRead(READ, ANNA, ids[4])).toEqual({
      success: true,
    })
    expect(await pointerOf(ANNA)).toBe(ids[4])
  })

  it('refuses an id no message can have', async () => {
    await expect(dbUpdateChatConversationMemberLastRead(READ, ANNA, 0)).rejects.toThrow(
      'not a message id',
    )
  })
})

describe('dbSelectChatConversationMember', () => {
  const OWN = 4721
  const CARL = { communityUuid: HOME, gradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }

  beforeAll(async () => {
    await dbInsertChatConversationMembers(OWN, [ANNA, BEN])
    await db
      .update(chatConversationMembersTable)
      .set({ lastReadMessageId: 17 })
      .where(
        and(
          eq(chatConversationMembersTable.conversationId, OWN),
          eq(chatConversationMembersTable.gradidoId, ANNA.gradidoId),
        ),
      )
  })

  it("hands out the named member's own row, read pointer and mute mark", async () => {
    expect(await dbSelectChatConversationMember(OWN, ANNA)).toMatchObject({
      conversationId: OWN,
      communityUuid: ANNA.communityUuid,
      gradidoId: ANNA.gradidoId,
      lastReadMessageId: 17,
      mutedAt: null,
    })
    expect(await dbSelectChatConversationMember(OWN, BEN)).toMatchObject({
      gradidoId: BEN.gradidoId,
      lastReadMessageId: null,
    })
  })

  it('finds a member named in capitals, as the column compares', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: ANNA.gradidoId.toUpperCase() }
    expect((await dbSelectChatConversationMember(OWN, shouting))?.lastReadMessageId).toBe(17)
  })

  it('answers null for somebody not in the conversation, and in a conversation that is none', async () => {
    expect(await dbSelectChatConversationMember(OWN, CARL)).toBeNull()
    expect(await dbSelectChatConversationMember(OWN + 1, ANNA)).toBeNull()
  })
})

describe('dbUpdateChatConversationMemberMuted', () => {
  const QUIET = 4722
  const CARL = { communityUuid: HOME, gradidoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }
  const muted = async (member: { communityUuid: string; gradidoId: string }) =>
    (await dbSelectChatConversationMember(QUIET, member))?.mutedAt

  beforeAll(async () => {
    await dbInsertChatConversationMembers(QUIET, [ANNA, BEN])
  })

  it("marks the named member's row muted, with the moment given", async () => {
    const at = new Date('2026-09-24T12:00:00.123Z')
    expect(await dbUpdateChatConversationMemberMuted(QUIET, ANNA, at)).toEqual({ success: true })
    expect((await muted(ANNA))?.getTime()).toBe(at.getTime())
  })

  // E-024: the quiet is the one member's own. What the other hears stays as it is.
  it("leaves the other member's row as it is", async () => {
    expect(await muted(BEN)).toBeNull()
  })

  it('lifts the mark again, and takes lifting it twice as a success (FOUND_ROWS)', async () => {
    expect(await dbUpdateChatConversationMemberMuted(QUIET, ANNA, null)).toEqual({ success: true })
    expect(await muted(ANNA)).toBeNull()
    expect(await dbUpdateChatConversationMemberMuted(QUIET, ANNA, null)).toEqual({ success: true })
    expect(await muted(ANNA)).toBeNull()
  })

  it('finds a member named in capitals, as the column compares', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: BEN.gradidoId.toUpperCase() }
    const at = new Date('2026-09-24T13:00:00.000Z')
    expect(await dbUpdateChatConversationMemberMuted(QUIET, shouting, at)).toEqual({
      success: true,
    })
    expect((await muted(BEN))?.getTime()).toBe(at.getTime())
  })

  it('reports a member who is not in the conversation as not found, and writes no row', async () => {
    const result = await dbUpdateChatConversationMemberMuted(QUIET, CARL, new Date())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.name).toBe('DBNotFoundError')
    }
    expect(await dbSelectChatConversationMember(QUIET, CARL)).toBeNull()
    // Nor in a conversation that does not exist.
    const nowhere = await dbUpdateChatConversationMemberMuted(QUIET + 1, ANNA, new Date())
    expect(nowhere.success).toBe(false)
  })
})
