// AI-GENERATED — not an architecture reference
import { ChatMemberRef, ChatMessageReactionSelect } from 'database'
import { isSameChatMember } from './ChatConversation.logic'

/**
 * How many reactions one HTTP request may set or take back (setChatMessageReaction), over every
 * alias -- counted in RequestBudget (server/context.ts). Each one is a transaction, and each
 * touches its message for every member's next beat; a document may repeat the field any number of
 * times.
 *
 * The wallet sends one a request. Ten rather than one for the reason
 * MEMBER_AVATARS_FULL_MAX_PER_REQUEST gives: a limit ordinary use can reach gets raised by
 * whoever hits it, without the reasoning being read again.
 */
export const CHAT_REACTIONS_MAX_PER_REQUEST = 10

/** One emoji under a message, as a member reads it. */
export interface ChatReactionCount {
  emoji: string
  /** How many members reacted with it. */
  count: number
  /** Whether the reader is one of them. */
  mine: boolean
}

/**
 * The reactions to ONE message as `reader` reads them: every emoji once, with how many members
 * reacted with it and whether the reader did -- in the order the emoji came up first. `rows` are
 * that message's reactions in the order the members reacted (dbSelectChatMessageReactions).
 *
 * It names nobody: a member learns how many, and of themselves that they are among them.
 */
export const chatReactionCounts = (
  rows: ChatMessageReactionSelect[],
  reader: ChatMemberRef,
): ChatReactionCount[] => {
  const counts = new Map<string, ChatReactionCount>()
  for (const row of rows) {
    const entry = counts.get(row.emoji) ?? { emoji: row.emoji, count: 0, mine: false }
    entry.count += 1
    entry.mine ||= isSameChatMember(row, reader)
    counts.set(row.emoji, entry)
  }
  return [...counts.values()]
}
