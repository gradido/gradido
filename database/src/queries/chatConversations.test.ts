// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { v4 as uuidv4 } from 'uuid'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { User as DbUser } from '../entity'
import {
  ChatMessageInsert,
  chatConversationMembersTable,
  chatConversationsTable,
  chatMessagesTable,
} from '../schemas'
import { dbUpdateChatConversationMemberLastRead } from './chatConversationMembers'
import {
  dbEnsureDirectChatConversation,
  dbFindDirectChatConversation,
  dbSelectDirectChatContactsByMember,
  directChatPairKey,
} from './chatConversations'
import { dbInsertChatMessage } from './chatMessages'

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

/**
 * The fourth source of the contact list. Its own people, none of them from the blocks above,
 * so that nothing here depends on what those left behind.
 *
 * ⚠️ Every message carries its own arrival time, set here: a date the default filled in would
 * make first and last the same millisecond, and the test could not tell them apart.
 */
describe('dbSelectDirectChatContactsByMember', () => {
  const at = (day: number) => new Date(Date.UTC(2026, 8, day, 12, 0, 0))
  const member = () => ({ communityUuid: HOME, gradidoId: uuidv4() })
  const MIA = member()
  // A member of this community with a users row.
  const NOAH = member()
  // A member of another community this server has no users row for; Mia wrote to her.
  const OLGA = { communityUuid: OTHER, gradidoId: uuidv4() }
  // A member of this community whose account is deleted.
  const PIA = member()
  // Somebody only Noah writes to.
  const QUIN = member()
  // Somebody Mia has a conversation with, but no message in it.
  const RUTH = member()

  const userRows: DbUser[] = []
  const withUserRow = async (who: { communityUuid: string; gradidoId: string }, alias: string) => {
    const row = new DbUser()
    row.gradidoID = who.gradidoId
    row.communityUuid = who.communityUuid
    row.alias = alias
    const saved = await row.save()
    userRows.push(saved)
    return saved
  }

  const write = async (
    conversationId: number,
    sender: { communityUuid: string; gradidoId: string },
    day: number,
  ) => {
    const row: ChatMessageInsert = {
      messageUuid: uuidv4(),
      conversationId,
      senderCommunityUuid: sender.communityUuid,
      senderGradidoId: sender.gradidoId,
      subject: null,
      body: `day ${day}`,
      notify: 'email',
      deliveryState: 'delivered',
      createdAt: at(day),
    }
    const stored = await dbInsertChatMessage(row)
    if (!stored.success) {
      throw new Error(`fixture: the message of day ${day} was not filed`)
    }
    return stored.value
  }

  const contactsOf = async (who: { communityUuid: string; gradidoId: string }) =>
    Object.fromEntries(
      (await dbSelectDirectChatContactsByMember(who)).map((row) => [row.gradidoId, row]),
    )

  let noahRow: DbUser
  let piaRow: DbUser
  let noahsSecond: number

  beforeAll(async () => {
    noahRow = await withUserRow(NOAH, 'noahChat')
    piaRow = await withUserRow(PIA, 'piaChat')
    await DbUser.update(piaRow.id, { deletedAt: at(1) })

    // Noah's pair goes in written in capitals: the list must still name him the way his
    // users row does, which is how the booking and referral bundles key him.
    const noahShouting = {
      communityUuid: NOAH.communityUuid.toUpperCase(),
      gradidoId: NOAH.gradidoId.toUpperCase(),
    }
    const withNoah = await dbEnsureDirectChatConversation(MIA, noahShouting)
    await write(withNoah.id, MIA, 1)
    noahsSecond = (await write(withNoah.id, NOAH, 2)).id
    await write(withNoah.id, NOAH, 3)
    await write(withNoah.id, MIA, 4)
    const deleted = await write(withNoah.id, NOAH, 5)
    await db
      .update(chatMessagesTable)
      .set({ deletedAt: at(6) })
      .where(eq(chatMessagesTable.id, deleted.id))

    // Mia wrote to Olga, across the border. Her own copy names Olga by the pair alone; an
    // answer FROM Olga would need a users row for her here, because the receiving server finds
    // the sender by it (SendEmailCommand) -- so without one, this is the shape that occurs.
    const withOlga = await dbEnsureDirectChatConversation(MIA, OLGA)
    await write(withOlga.id, MIA, 7)

    const withPia = await dbEnsureDirectChatConversation(PIA, MIA)
    await write(withPia.id, PIA, 8)

    const noahWithQuin = await dbEnsureDirectChatConversation(NOAH, QUIN)
    await write(noahWithQuin.id, QUIN, 9)

    await dbEnsureDirectChatConversation(MIA, RUTH)

    // A group with Mia and Noah in it (P5): not a person, so not a second Noah.
    await db.insert(chatConversationsTable).values({
      conversationUuid: uuidv4(),
      kind: 'group',
      homeCommunityUuid: HOME,
      title: 'Saturday market',
      createdByCommunityUuid: MIA.communityUuid,
      createdByGradidoId: MIA.gradidoId,
    })
    const [group] = await db
      .select()
      .from(chatConversationsTable)
      .where(eq(chatConversationsTable.kind, 'group'))
    await db.insert(chatConversationMembersTable).values([
      { conversationId: group.id, ...MIA },
      { conversationId: group.id, ...NOAH },
    ])
    await write(group.id, NOAH, 10)
  })

  afterAll(async () => {
    await db.delete(chatMessagesTable)
    await DbUser.delete(userRows.map((row) => row.id))
  })

  it('names everybody the member has a direct conversation with, each once', async () => {
    const rows = await dbSelectDirectChatContactsByMember(MIA)
    expect(rows.map((row) => row.gradidoId).sort()).toEqual(
      [NOAH.gradidoId, OLGA.gradidoId, PIA.gradidoId].sort(),
    )
  })

  it('takes a partner with a users row from that row, spelling included', async () => {
    const { [NOAH.gradidoId]: noah } = await contactsOf(MIA)
    expect(noah).toMatchObject({
      linkedUserId: noahRow.id,
      communityUuid: NOAH.communityUuid,
      gradidoId: NOAH.gradidoId,
      alias: 'noahChat',
      deletedAt: null,
    })
  })

  it('brings a partner from another community without a users row, with no name', async () => {
    const { [OLGA.gradidoId]: olga } = await contactsOf(MIA)
    expect(olga).toMatchObject({
      linkedUserId: null,
      communityUuid: OTHER,
      gradidoId: OLGA.gradidoId,
      alias: null,
      deletedAt: null,
      // Mia's own message: nothing unread.
      unreadChatMessages: 0,
    })
    expect(olga.firstAt.getTime()).toBe(at(7).getTime())
    expect(olga.lastAt.getTime()).toBe(at(7).getTime())
  })

  it('keeps a partner whose account is deleted, with the deletion mark', async () => {
    const { [PIA.gradidoId]: pia } = await contactsOf(MIA)
    expect(pia.linkedUserId).toBe(piaRow.id)
    expect(pia.deletedAt).toBeInstanceOf(Date)
  })

  it('dates the contact with the first and the latest message, a deleted one not counted', async () => {
    const { [NOAH.gradidoId]: noah } = await contactsOf(MIA)
    expect(noah.firstAt.getTime()).toBe(at(1).getTime())
    expect(noah.lastAt.getTime()).toBe(at(4).getTime())
  })

  it("counts as unread only the other side's messages, and no deleted one", async () => {
    const { [NOAH.gradidoId]: noah } = await contactsOf(MIA)
    // Days 2 and 3 are Noah's; day 5 is his too, but deleted; days 1 and 4 are Mia's own.
    expect(noah.unreadChatMessages).toBe(2)
    const { [MIA.gradidoId]: mia } = await contactsOf(NOAH)
    expect(mia.unreadChatMessages).toBe(2)
  })

  it('counts only what lies above the read pointer', async () => {
    const withNoah = await dbFindDirectChatConversation(MIA, NOAH)
    if (!withNoah) {
      throw new Error('fixture: no conversation of Mia and Noah')
    }
    await dbUpdateChatConversationMemberLastRead(withNoah.id, MIA, noahsSecond)
    const { [NOAH.gradidoId]: noah } = await contactsOf(MIA)
    expect(noah.unreadChatMessages).toBe(1)
    // Noah's own count is his own pointer's business, and his pointer did not move.
    const { [MIA.gradidoId]: mia } = await contactsOf(NOAH)
    expect(mia.unreadChatMessages).toBe(2)
  })

  it('leaves out the conversations the member is not in', async () => {
    expect(Object.keys(await contactsOf(MIA))).not.toContain(QUIN.gradidoId)
    expect(Object.keys(await contactsOf(NOAH)).sort()).toEqual(
      [MIA.gradidoId, QUIN.gradidoId].sort(),
    )
  })

  it('leaves out a conversation without a message, and a group', async () => {
    const rows = await dbSelectDirectChatContactsByMember(MIA)
    expect(rows.map((row) => row.gradidoId)).not.toContain(RUTH.gradidoId)
    expect(rows.filter((row) => row.gradidoId === NOAH.gradidoId)).toHaveLength(1)
    expect((await contactsOf(NOAH))[MIA.gradidoId].lastAt.getTime()).toBe(at(4).getTime())
  })

  it('answers the same for the member named in capitals, as the column compares', async () => {
    const shouting = { communityUuid: HOME.toUpperCase(), gradidoId: MIA.gradidoId.toUpperCase() }
    expect(await dbSelectDirectChatContactsByMember(shouting)).toEqual(
      await dbSelectDirectChatContactsByMember(MIA),
    )
  })

  it('answers nothing for somebody without a conversation', async () => {
    expect(await dbSelectDirectChatContactsByMember(member())).toEqual([])
  })
})
