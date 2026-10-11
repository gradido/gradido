// AI-GENERATED — not an architecture reference
import { and, asc, eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import {
  ChatMessageReactionInsert,
  ChatMessageReactionSelect,
  chatMessageReactionsTable,
} from '../schemas/drizzle.schema'
import { ChatMemberRef } from './chatConversationMembers'

/**
 * A member's reaction to a message, set or replaced (migration 0158): one row a member and
 * message. Where the member has reacted to it already, the unique key catches the second row and
 * the emoji of the first is changed -- its place among the reactions stays.
 *
 * ⛔ Whether the member may react to that message is not asked here: the statement beside this
 * one holds that rule, and holds the message's row while both are written
 * (dbUpdateChatMessageReactedAt, in the same transaction -- `tx`).
 */
export async function dbUpsertChatMessageReaction(
  row: ChatMessageReactionInsert,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<void> {
  await (tx ?? drizzleDb())
    .insert(chatMessageReactionsTable)
    .values(row)
    .onDuplicateKeyUpdate({ set: { emoji: row.emoji } })
}

/**
 * Takes a member's reaction to a message back and says whether there was one. None is an
 * answer, not a failure. The pair is compared the way the columns compare it, without regard to
 * case. Written beside dbUpdateChatMessageReactedAt, as dbUpsertChatMessageReaction is.
 */
export async function dbDeleteChatMessageReaction(
  messageId: number,
  member: ChatMemberRef,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<boolean> {
  const result = await (tx ?? drizzleDb())
    .delete(chatMessageReactionsTable)
    .where(
      and(
        eq(chatMessageReactionsTable.messageId, messageId),
        eq(chatMessageReactionsTable.communityUuid, member.communityUuid),
        eq(chatMessageReactionsTable.gradidoId, member.gradidoId),
      ),
    )
  return (result[0]?.affectedRows ?? 0) > 0
}

/**
 * The reactions to these messages, in one query for a whole page, in the order the members
 * reacted. A message without a reaction has no row.
 *
 * ⛔ Not asked for a member: whoever is handed a message is handed its reactions, and whether
 * they may read the message is settled before its id gets here (chatMessagesOf).
 */
export async function dbSelectChatMessageReactions(
  messageIds: number[],
): Promise<ChatMessageReactionSelect[]> {
  if (messageIds.length === 0) {
    return []
  }
  return drizzleDb()
    .select()
    .from(chatMessageReactionsTable)
    .where(inArray(chatMessageReactionsTable.messageId, messageIds))
    .orderBy(asc(chatMessageReactionsTable.id))
}
