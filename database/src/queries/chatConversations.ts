// AI-GENERATED — not an architecture reference
import { and, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { alias as aliasedTable } from 'drizzle-orm/mysql-core'
import { VoidResult } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import {
  ChatConversationSelect,
  chatConversationMembersTable,
  chatConversationsTable,
  chatMessagesTable,
} from '../schemas/drizzle.schema'
import { ChatMemberRef, dbInsertChatConversationMembers } from './chatConversationMembers'
import { dbSelectUsersByUuids } from './user'

const ChatGroupNotFound = (where: string) => new DBNotFoundError('chat_conversations', where)

/**
 * The key of the direct conversation between two members: each as `communityUuid/gradidoId`,
 * lower-cased, sorted, joined with `|`. The same two members give the same key in either
 * order.
 *
 * Lower-cased because the column compares without regard to case (utf8mb4_unicode_ci) and a
 * JavaScript sort does not: a uuid written in capitals would sort to the other side of the
 * `|` and open a second conversation for the same pair.
 */
export const directChatPairKey = (a: ChatMemberRef, b: ChatMemberRef): string =>
  [a, b]
    .map((member) => `${member.communityUuid}/${member.gradidoId}`.toLowerCase())
    .sort()
    .join('|')

/** The direct conversation of these two members, named in either order, or null. */
export async function dbFindDirectChatConversation(
  a: ChatMemberRef,
  b: ChatMemberRef,
): Promise<ChatConversationSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(chatConversationsTable)
    .where(eq(chatConversationsTable.directPairKey, directChatPairKey(a, b)))
    .limit(1)
  return rows.at(0) ?? null
}

/**
 * The direct conversation of these two members -- opened by `sender` if there is none yet --
 * with both of them in it.
 *
 * Two first messages written at the same moment, one from each side, end up in ONE
 * conversation: the unique key on direct_pair_key refuses the second row, the no-op update
 * turns the refusal into "nothing changed", and both read the same row afterwards.
 *
 * The members go in every time, not only when the conversation is new. With FOUND_ROWS
 * (mysql2's default) the upsert reports one row either way, so "new" cannot be told from
 * "there already" -- and a conversation that lost its members to a crash between the two
 * statements is completed by the next message.
 *
 * Not wrapped in Result: with valid input it always returns the conversation (AGENTS.md).
 */
export async function dbEnsureDirectChatConversation(
  sender: ChatMemberRef,
  recipient: ChatMemberRef,
): Promise<ChatConversationSelect> {
  const directPairKey = directChatPairKey(sender, recipient)
  await drizzleDb()
    .insert(chatConversationsTable)
    .values({
      conversationUuid: uuidv4(),
      kind: 'direct',
      directPairKey,
      createdByCommunityUuid: sender.communityUuid,
      createdByGradidoId: sender.gradidoId,
    })
    .onDuplicateKeyUpdate({
      set: { directPairKey: sql`${chatConversationsTable.directPairKey}` },
    })
  const conversation = await dbFindDirectChatConversation(sender, recipient)
  if (!conversation) {
    throw new Error(`chat_conversations: no row for ${directPairKey} right after writing it`)
  }
  await dbInsertChatConversationMembers(conversation.id, [sender, recipient])
  return conversation
}

/**
 * Everybody this member has a direct conversation with: one row per conversation, and so
 * one per person -- `direct_pair_key` is unique, so two members share at most one of them.
 * The fourth source of the contact list (E-023, KF-012): a message is a shared event, so the
 * two of them are contacts of each other without either adding the other.
 *
 * Per person: the pair and, where this server has a `users` row for it, that row's id, alias
 * and deletion mark -- a member of another community who never booked with anybody here has
 * none, and then only the pair is known. The pair is the row's own spelling where there is a
 * row, so that it is the same string the booking and referral bundles key the person by.
 *
 * `firstAt` and `lastAt` are when the first and the latest message arrived HERE (E-018).
 * `unreadChatMessages` counts the messages with an id above the member's own read pointer
 * that somebody else wrote -- the member's own messages are never unread to them.
 *
 * Messages marked deleted count for none of the three, as they are on no page of the thread;
 * a conversation left without a message has no row. So has one whose other member is
 * missing: nothing to name.
 *
 * Direct conversations only: a group (P5) is not a person.
 *
 * ⛔ Two statements, not one join. The `users` rows are looked up by the pairs as parameters
 * (`dbSelectUsersByUuids`): joining `users` to the chat tables compares columns of two
 * collations, which the database refuses where they differ -- as it does in the database CI.
 */
export async function dbSelectDirectChatContactsByMember(member: ChatMemberRef) {
  const me = aliasedTable(chatConversationMembersTable, 'me')
  const partner = aliasedTable(chatConversationMembersTable, 'partner')
  const writtenByMe = sql`${chatMessagesTable.senderCommunityUuid} = ${me.communityUuid} and ${chatMessagesTable.senderGradidoId} = ${me.gradidoId}`
  const aboveMyPointer = sql`${chatMessagesTable.id} > coalesce(${me.lastReadMessageId}, 0)`
  const conversations = await drizzleDb()
    .select({
      communityUuid: partner.communityUuid,
      gradidoId: partner.gradidoId,
      firstAt: sql`min(${chatMessagesTable.createdAt})`.mapWith(chatMessagesTable.createdAt),
      lastAt: sql`max(${chatMessagesTable.createdAt})`.mapWith(chatMessagesTable.createdAt),
      unreadChatMessages:
        sql`count(case when ${aboveMyPointer} and not (${writtenByMe}) then 1 end)`.mapWith(Number),
    })
    .from(chatConversationsTable)
    .innerJoin(
      me,
      and(
        eq(me.conversationId, chatConversationsTable.id),
        eq(me.communityUuid, member.communityUuid),
        eq(me.gradidoId, member.gradidoId),
      ),
    )
    .innerJoin(
      partner,
      and(
        eq(partner.conversationId, chatConversationsTable.id),
        or(ne(partner.communityUuid, me.communityUuid), ne(partner.gradidoId, me.gradidoId)),
      ),
    )
    .innerJoin(
      chatMessagesTable,
      and(
        eq(chatMessagesTable.conversationId, chatConversationsTable.id),
        isNull(chatMessagesTable.deletedAt),
      ),
    )
    .where(eq(chatConversationsTable.kind, 'direct'))
    .groupBy(chatConversationsTable.id, partner.communityUuid, partner.gradidoId)

  // Matched without regard to case, the way both tables compare (see directChatPairKey).
  const pairKey = (pair: ChatMemberRef) => `${pair.communityUuid}/${pair.gradidoId}`.toLowerCase()
  const usersByPair = new Map(
    (await dbSelectUsersByUuids(conversations)).map((user) => [pairKey(user), user]),
  )
  return conversations.map((conversation) => {
    const user = usersByPair.get(pairKey(conversation))
    return {
      linkedUserId: user?.id ?? null,
      communityUuid: user?.communityUuid ?? conversation.communityUuid,
      gradidoId: user?.gradidoId ?? conversation.gradidoId,
      alias: user?.alias ?? null,
      deletedAt: user?.deletedAt ?? null,
      firstAt: conversation.firstAt,
      lastAt: conversation.lastAt,
      unreadChatMessages: conversation.unreadChatMessages,
    }
  })
}

/**
 * A group (P5) by the uuid it is known by -- to the wallet, and in the links of its mails -- or
 * null: no such conversation, or one that is not a group. The uuid of a direct conversation does
 * not make it a group.
 */
export async function dbFindChatGroupByUuid(
  groupUuid: string,
): Promise<ChatConversationSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(chatConversationsTable)
    .where(
      and(
        eq(chatConversationsTable.conversationUuid, groupUuid),
        eq(chatConversationsTable.kind, 'group'),
      ),
    )
    .limit(1)
  return rows.at(0) ?? null
}

/**
 * Opens a group (P5): its row, with the community it lives in (E-026: the founder's) and who
 * opened it. The members go in separately (dbInsertChatConversationMembers), the founder as the
 * owner.
 *
 * The uuid is the caller's: the group is known by it from the first moment on. A second group
 * under the same uuid is a bug in the caller -- the unique key refuses the row, and that is
 * thrown (AGENTS.md, programmer error). Not wrapped in Result: with valid input it always hands
 * back the row.
 */
export async function dbInsertChatGroup(group: {
  groupUuid: string
  title: string
  homeCommunityUuid: string
  createdBy: ChatMemberRef
}): Promise<ChatConversationSelect> {
  await drizzleDb().insert(chatConversationsTable).values({
    conversationUuid: group.groupUuid,
    kind: 'group',
    homeCommunityUuid: group.homeCommunityUuid,
    title: group.title,
    createdByCommunityUuid: group.createdBy.communityUuid,
    createdByGradidoId: group.createdBy.gradidoId,
  })
  const row = await dbFindChatGroupByUuid(group.groupUuid)
  if (!row) {
    throw new Error(`chat_conversations: no group ${group.groupUuid} right after writing it`)
  }
  return row
}

/**
 * Gives the group another name. DBNotFoundError where no group has this id -- a direct
 * conversation has none to change; nothing is written then. Writing the name it has already is a
 * success: mysql2 connects with FOUND_ROWS, so `affectedRows` counts the matched row.
 */
export async function dbUpdateChatGroupTitle(
  conversationId: number,
  title: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(chatConversationsTable)
    .set({ title })
    .where(
      and(eq(chatConversationsTable.id, conversationId), eq(chatConversationsTable.kind, 'group')),
    )
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: ChatGroupNotFound(`id = ${conversationId} and kind = 'group'`) }
}

/**
 * Which of these conversations are groups, by id, and the uuid each is known by. A message
 * carries its group's uuid (P5), so that the wallet sorts it into the group -- never into the
 * thread with its sender, which an empty thread would otherwise take it for. One query for a
 * whole page or update; direct conversations are not in the answer.
 */
export async function dbSelectChatGroupUuids(
  conversationIds: number[],
): Promise<Map<number, string>> {
  const ids = [...new Set(conversationIds)]
  if (ids.length === 0) {
    return new Map()
  }
  const rows = await drizzleDb()
    .select({ id: chatConversationsTable.id, groupUuid: chatConversationsTable.conversationUuid })
    .from(chatConversationsTable)
    .where(and(inArray(chatConversationsTable.id, ids), eq(chatConversationsTable.kind, 'group')))
  return new Map(rows.map((row) => [row.id, row.groupUuid]))
}

/**
 * The groups this member is in (P5), with what the list and the group's window show of each: who
 * opened it, the member's own role and mute mark, since when they are in it, how many members it
 * has, how many messages wait unread for this member, and when the latest one arrived here
 * (E-018).
 *
 * Unread as everywhere in the chat: above the member's own read pointer, written by somebody
 * else, not marked deleted (dbSelectChatUnreadSummary counts it per conversation, this per
 * message). The latest message is the top entry of the group in the index on
 * (conversation_id, id), read one step backwards from its end, not with max() (P4a: max() in a
 * correlated subquery reads the group's whole range).
 *
 * Newest activity first -- the latest message, or the opening of a group without one.
 */
export async function dbSelectChatGroupsByMember(member: ChatMemberRef) {
  const me = aliasedTable(chatConversationMembersTable, 'me')
  const ofThisGroup = sql`${chatMessagesTable.conversationId} = ${chatConversationsTable.id}`
  const aboveMyPointer = sql`${chatMessagesTable.id} > coalesce(${me.lastReadMessageId}, 0)`
  const writtenByMe = sql`${chatMessagesTable.senderCommunityUuid} = ${me.communityUuid} and ${chatMessagesTable.senderGradidoId} = ${me.gradidoId}`
  const groups = await drizzleDb()
    .select({
      id: chatConversationsTable.id,
      groupUuid: chatConversationsTable.conversationUuid,
      title: chatConversationsTable.title,
      homeCommunityUuid: chatConversationsTable.homeCommunityUuid,
      createdAt: chatConversationsTable.createdAt,
      createdByCommunityUuid: chatConversationsTable.createdByCommunityUuid,
      createdByGradidoId: chatConversationsTable.createdByGradidoId,
      role: me.role,
      joinedAt: me.joinedAt,
      mutedAt: me.mutedAt,
      memberCount:
        sql`(select count(*) from ${chatConversationMembersTable} where ${chatConversationMembersTable.conversationId} = ${chatConversationsTable.id})`.mapWith(
          Number,
        ),
      unreadMessages:
        sql`(select count(*) from ${chatMessagesTable} where ${ofThisGroup} and ${aboveMyPointer} and ${chatMessagesTable.deletedAt} is null and not (${writtenByMe}))`.mapWith(
          Number,
        ),
      // Null for a group without a message yet: decoded the column's way where there is one.
      lastMessageAt:
        sql`(select ${chatMessagesTable.createdAt} from ${chatMessagesTable} where ${ofThisGroup} and ${chatMessagesTable.deletedAt} is null order by ${chatMessagesTable.id} desc limit 1)`.mapWith(
          (value): Date | null =>
            value === null ? null : (chatMessagesTable.createdAt.mapFromDriverValue(value) as Date),
        ),
    })
    .from(chatConversationsTable)
    .innerJoin(
      me,
      and(
        eq(me.conversationId, chatConversationsTable.id),
        eq(me.communityUuid, member.communityUuid),
        eq(me.gradidoId, member.gradidoId),
      ),
    )
    .where(eq(chatConversationsTable.kind, 'group'))
  const lastActivity = (group: (typeof groups)[number]) =>
    (group.lastMessageAt ?? group.createdAt).getTime()
  return groups.sort((a, b) => lastActivity(b) - lastActivity(a) || b.id - a.id)
}
