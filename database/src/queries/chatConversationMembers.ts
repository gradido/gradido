// AI-GENERATED — not an architecture reference
import { and, eq, exists, sql } from 'drizzle-orm'
import { VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import {
  ChatConversationMemberSelect,
  chatConversationMembersTable,
  chatMessagesTable,
} from '../schemas/drizzle.schema'

const ChatConversationMemberNotFound = (where: string) =>
  new DBNotFoundError('chat_conversation_members', where)

/**
 * A member of a conversation, named the way every server can name them: the uuid pair of
 * community and member. Never users.id and never the alias -- a member of another community
 * has no users row here, and an alias changes (see migration 0128).
 */
export interface ChatMemberRef {
  communityUuid: string
  gradidoId: string
}

/** The condition that names one member's row: the conversation and the pair. */
const memberRow = (conversationId: number, member: ChatMemberRef) =>
  and(
    eq(chatConversationMembersTable.conversationId, conversationId),
    eq(chatConversationMembersTable.communityUuid, member.communityUuid),
    eq(chatConversationMembersTable.gradidoId, member.gradidoId),
  )

/**
 * One member's row of a conversation -- their read pointer and their mute mark -- or null
 * when they are not in it. The pair is compared the way the columns compare it, without
 * regard to case.
 */
export async function dbSelectChatConversationMember(
  conversationId: number,
  member: ChatMemberRef,
): Promise<ChatConversationMemberSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(chatConversationMembersTable)
    .where(memberRow(conversationId, member))
    .limit(1)
  return rows.at(0) ?? null
}

/**
 * Puts these members into the conversation. A member who is in it already stays as they are:
 * the primary key (conversation, community, member) catches the second row and the statement
 * changes nothing -- their role, joined_at and read pointer included. That is what lets this
 * run with every message and not only with the first.
 *
 * One statement per member, not one for all of them. Two first messages written at the same
 * moment, one from each side, put the same two members in -- in opposite order. A single
 * statement takes its row locks in the order of its rows, so the two statements waited for
 * each other and InnoDB ended one of them as a deadlock (database CI, 23.09.2026). A
 * statement per row holds the lock of that one row and commits before the next.
 *
 * Plain `void`: with valid input this always succeeds (AGENTS.md, "functions that always
 * succeed on valid input").
 */
export async function dbInsertChatConversationMembers(
  conversationId: number,
  members: ChatMemberRef[],
): Promise<void> {
  for (const member of members) {
    await drizzleDb()
      .insert(chatConversationMembersTable)
      .values({
        conversationId,
        communityUuid: member.communityUuid,
        gradidoId: member.gradidoId,
      })
      .onDuplicateKeyUpdate({
        set: { conversationId: sql`${chatConversationMembersTable.conversationId}` },
      })
  }
}

/**
 * Moves the member's read pointer up to `messageId` -- up only: the pointer becomes the larger
 * of the two, so an older id, sent late, leaves it where it is.
 *
 * `messageId` is the highest id the member has been SHOWN, handed in by the caller. The
 * highest id in the conversation would be the wrong number: a message that arrived between
 * loading the page and marking it would count as read without ever having been on screen.
 *
 * Writes the row of the member named here and no other -- the pair is part of the where
 * clause. ChatResolver names the caller, so what a member marks read is only ever their own.
 *
 * ⛔ `messageId` has to be a message OF THIS CONVERSATION -- a condition in the same statement,
 * so nothing can come between the check and the write. Message ids are counted across all
 * conversations, and the pointer never moves back: an id from another conversation, or one no
 * message has, would push it past every message still to come, and the conversation would
 * show nothing unread for good, without an error anywhere (coderabbit on #3965). A message
 * marked deleted still counts: it had its place in the conversation when it was shown.
 *
 * DBNotFoundError when the member is not in the conversation or the message is not in it;
 * nothing is written then. Writing the value the row has already is a success: mysql2
 * connects with FOUND_ROWS, so `affectedRows` counts the matched row. Throws for an id below
 * 1: no message has one, so the caller has a bug.
 */
export async function dbUpdateChatConversationMemberLastRead(
  conversationId: number,
  member: ChatMemberRef,
  messageId: number,
): Promise<VoidResult<DBNotFoundError>> {
  if (!Number.isInteger(messageId) || messageId < 1) {
    throw new Error(`dbUpdateChatConversationMemberLastRead: ${messageId} is not a message id`)
  }
  const result = await drizzleDb()
    .update(chatConversationMembersTable)
    .set({
      // COALESCE because GREATEST with a NULL is NULL: a member who has read nothing yet
      // would otherwise keep reading nothing.
      lastReadMessageId: sql`greatest(coalesce(${chatConversationMembersTable.lastReadMessageId}, 0), ${messageId})`,
    })
    .where(
      and(
        memberRow(conversationId, member),
        exists(
          drizzleDb()
            .select({ id: chatMessagesTable.id })
            .from(chatMessagesTable)
            .where(
              and(
                eq(chatMessagesTable.id, messageId),
                eq(chatMessagesTable.conversationId, conversationId),
              ),
            ),
        ),
      ),
    )
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: ChatConversationMemberNotFound(
      `conversation_id = ${conversationId} and member = ${member.communityUuid}/${member.gradidoId} and message ${messageId} in it`,
    ),
  }
}

/**
 * Sets the member's mute mark in the conversation: the moment they asked for quiet, or null to
 * lift it. A muted member gets no mail about the conversation, whatever the sender asked for
 * (E-024) -- the mark is read on the member's own server, where the mail would go out.
 *
 * Writes the row of the member named here and no other -- the pair is part of the where
 * clause, as for the read pointer. ChatResolver names the caller, so a member only ever mutes
 * for themselves; the other member's row, and so whether the other member is mailed, stays as
 * it is.
 *
 * DBNotFoundError when the member is not in the conversation; nothing is written then. Writing
 * the value the row has already is a success: mysql2 connects with FOUND_ROWS, so
 * `affectedRows` counts the matched row.
 */
export async function dbUpdateChatConversationMemberMuted(
  conversationId: number,
  member: ChatMemberRef,
  mutedAt: Date | null,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(chatConversationMembersTable)
    .set({ mutedAt })
    .where(memberRow(conversationId, member))
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: ChatConversationMemberNotFound(
      `conversation_id = ${conversationId} and member = ${member.communityUuid}/${member.gradidoId}`,
    ),
  }
}
