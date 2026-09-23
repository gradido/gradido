// AI-GENERATED — not an architecture reference
import { ChatMemberRef } from 'database'

/** A page of a conversation when the caller names no size (chatMessagesWithMember). */
export const CHAT_MESSAGES_PAGE_DEFAULT = 50

/**
 * The largest page of a conversation one request may ask for. Enforced where the argument
 * arrives (ChatMessagesWithMemberArgs); asking for more is a bug in the caller.
 */
export const CHAT_MESSAGES_PAGE_MAX = 100

/**
 * Whether two references name the same member. Without regard to case, the way the
 * chat columns compare the pair (utf8mb4_unicode_ci) -- a uuid written in capitals is the
 * same member, as `directChatPairKey` treats it.
 */
export const isSameChatMember = (a: ChatMemberRef, b: ChatMemberRef): boolean =>
  a.communityUuid.toLowerCase() === b.communityUuid.toLowerCase() &&
  a.gradidoId.toLowerCase() === b.gradidoId.toLowerCase()
