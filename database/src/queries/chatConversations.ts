// AI-GENERATED — not an architecture reference
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm'
import { alias as aliasedTable } from 'drizzle-orm/mysql-core'
import { v4 as uuidv4 } from 'uuid'
import { drizzleDb } from '../AppDatabase'
import {
  ChatConversationSelect,
  chatConversationMembersTable,
  chatConversationsTable,
  chatMessagesTable,
  usersTable,
} from '../schemas/drizzle.schema'
import { ChatMemberRef, dbInsertChatConversationMembers } from './chatConversationMembers'

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
 */
export async function dbSelectDirectChatContactsByMember(member: ChatMemberRef) {
  const me = aliasedTable(chatConversationMembersTable, 'me')
  const partner = aliasedTable(chatConversationMembersTable, 'partner')
  const writtenByMe = sql`${chatMessagesTable.senderCommunityUuid} = ${me.communityUuid} and ${chatMessagesTable.senderGradidoId} = ${me.gradidoId}`
  const aboveMyPointer = sql`${chatMessagesTable.id} > coalesce(${me.lastReadMessageId}, 0)`
  return drizzleDb()
    .select({
      linkedUserId: usersTable.id,
      communityUuid: sql<string>`coalesce(${usersTable.communityUuid}, ${partner.communityUuid})`,
      gradidoId: sql<string>`coalesce(${usersTable.gradidoId}, ${partner.gradidoId})`,
      alias: usersTable.alias,
      deletedAt: usersTable.deletedAt,
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
    .leftJoin(
      usersTable,
      and(
        eq(usersTable.communityUuid, partner.communityUuid),
        eq(usersTable.gradidoId, partner.gradidoId),
      ),
    )
    .where(eq(chatConversationsTable.kind, 'direct'))
    .groupBy(
      chatConversationsTable.id,
      partner.communityUuid,
      partner.gradidoId,
      usersTable.id,
      usersTable.communityUuid,
      usersTable.gradidoId,
      usersTable.alias,
      usersTable.deletedAt,
    )
}
