// AI-GENERATED — not an architecture reference
import { ChatMemberRef } from 'database'

/** A page of a conversation when the caller names no size (chatMessagesWithMember). */
export const CHAT_MESSAGES_PAGE_DEFAULT = 50

/**
 * The largest page of a conversation one call may ask for. Enforced where the argument
 * arrives (ChatMessagesWithMemberArgs); asking for more is a bug in the caller.
 */
export const CHAT_MESSAGES_PAGE_MAX = 100

/**
 * How many pages of a conversation one HTTP request may ask for, over every alias and every
 * operation it carries -- counted in RequestBudget (server/context.ts). `limit` caps one page;
 * this caps how often a document may repeat the field, which `limit` cannot: without it one
 * request could read any number of pages of CHAT_MESSAGES_PAGE_MAX messages each (coderabbit
 * on #3965).
 *
 * Reading a thread needs one page per request. Ten rather than one for the reason
 * MEMBER_AVATARS_FULL_MAX_PER_REQUEST gives: a limit ordinary use can reach gets raised by
 * whoever hits it, without the reasoning being read again.
 */
export const CHAT_MESSAGE_PAGES_MAX_PER_REQUEST = 10

/**
 * How many new messages one call of newChatMessagesSince hands out when the caller names no
 * number: as many as a page of a thread (CHAT_MESSAGES_PAGE_DEFAULT). Between two beats of the
 * wallet far fewer arrive; the cap is for a member who comes back after a while.
 */
export const CHAT_UPDATE_MESSAGES_DEFAULT = 50

/**
 * The most new messages one call may ask for, as for a page (CHAT_MESSAGES_PAGE_MAX): enforced
 * where the argument arrives (NewChatMessagesSinceArgs), and asking for more is a bug in the
 * caller. Whoever was away longer gets the rest with the next calls -- `hasMore` says so, and
 * `latestId` says where to go on from.
 */
export const CHAT_UPDATE_MESSAGES_MAX = 100

/**
 * How often one HTTP request may ask newChatMessagesSince, over every alias and every operation
 * it carries -- counted in RequestBudget (server/context.ts), for the reason
 * CHAT_MESSAGE_PAGES_MAX_PER_REQUEST gives: `limit` caps one answer, not how often a document
 * repeats the field.
 *
 * The wallet asks once per beat. Five rather than one for the reason
 * MEMBER_AVATARS_FULL_MAX_PER_REQUEST gives: a limit that ordinary use can reach gets raised by
 * whoever hits it, without the reasoning being read again.
 */
export const CHAT_UPDATES_MAX_PER_REQUEST = 5

/**
 * Whether two references name the same member. Without regard to case, the way the
 * chat columns compare the pair (utf8mb4_unicode_ci) -- a uuid written in capitals is the
 * same member, as `directChatPairKey` treats it.
 */
export const isSameChatMember = (a: ChatMemberRef, b: ChatMemberRef): boolean =>
  a.communityUuid.toLowerCase() === b.communityUuid.toLowerCase() &&
  a.gradidoId.toLowerCase() === b.gradidoId.toLowerCase()
