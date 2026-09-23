// AI-GENERATED — not an architecture reference
import { sql } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { chatConversationMembersTable } from '../schemas/drizzle.schema'

/**
 * A member of a conversation, named the way every server can name them: the uuid pair of
 * community and member. Never users.id and never the alias -- a member of another community
 * has no users row here, and an alias changes (see migration 0128).
 */
export interface ChatMemberRef {
  communityUuid: string
  gradidoId: string
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
