// AI-GENERATED — not an architecture reference
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { drizzleDb } from '../AppDatabase'
import { ChatConversationSelect, chatConversationsTable } from '../schemas/drizzle.schema'
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
