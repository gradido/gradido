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
 * Plain `void`: with valid input this always succeeds (AGENTS.md, "functions that always
 * succeed on valid input").
 */
export async function dbInsertChatConversationMembers(
  conversationId: number,
  members: ChatMemberRef[],
): Promise<void> {
  await drizzleDb()
    .insert(chatConversationMembersTable)
    .values(
      members.map((member) => ({
        conversationId,
        communityUuid: member.communityUuid,
        gradidoId: member.gradidoId,
      })),
    )
    .onDuplicateKeyUpdate({
      set: { conversationId: sql`${chatConversationMembersTable.conversationId}` },
    })
}
