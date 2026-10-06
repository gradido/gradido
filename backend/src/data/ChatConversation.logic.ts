// AI-GENERATED — not an architecture reference
import { ChatEditPosition, ChatMemberRef } from 'database'

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
 * How far behind the database's clock a beat goes on from for changed messages (E-060): up to
 * that moment the changes count as settled. A change is stamped when its statement starts and
 * seen when it is committed; one still on its way while a beat reads would lie before the beat's
 * own moment and never be handed out. Ten seconds back, it comes with the next beat -- and so
 * does every change of those ten seconds once more, which costs nothing: the same message with
 * the same text.
 */
export const CHAT_EDITS_SETTLE_MS = 10_000

/**
 * The place a beat goes on from for changed messages, as it travels to the wallet and back
 * (newChatMessagesSince, `editedCursor`): the moment in milliseconds and the id within it,
 * "1759309233123-0". The wallet hands it back as it got it; what it means is this server's alone.
 */
export const CHAT_EDITS_CURSOR_PATTERN = /^\d{1,15}-\d{1,10}$/

export const chatEditsCursor = ({ editedAt, id }: ChatEditPosition): string =>
  `${editedAt.getTime()}-${id}`

/**
 * The place a cursor names. Throws for what is no cursor: the argument is checked where it
 * arrives (NewChatMessagesSinceArgs), so anything else here is a caller's bug.
 */
export const chatEditsPosition = (cursor: string): ChatEditPosition => {
  if (!CHAT_EDITS_CURSOR_PATTERN.test(cursor)) {
    throw new Error('chatEditsPosition: not a cursor')
  }
  const [ms, id] = cursor.split('-').map(Number)
  return { editedAt: new Date(ms), id }
}

/**
 * Where the next beat goes on from for changed messages (E-060).
 *
 * `settled`, before every message of that moment, wherever the answer held every change there
 * was -- the database's clock at the beat, CHAT_EDITS_SETTLE_MS back.
 *
 * `lastOfMore`, where more changed messages were left over the cap: the last one handed out. The
 * next beat goes on exactly after it -- unless it lies at `settled` or later: then from `settled`
 * as well, since a change before the last one may still be on its way. What was left over the
 * cap lies after the last one, so after `settled` too, and comes with the beats that follow.
 */
export const nextChatEditsPosition = (
  settled: Date,
  lastOfMore: ChatEditPosition | null,
): ChatEditPosition =>
  lastOfMore !== null && lastOfMore.editedAt.getTime() < settled.getTime()
    ? lastOfMore
    : { editedAt: settled, id: 0 }

/**
 * How many pictures of chat messages one HTTP request may be served (chatMessageImage), over
 * every alias and every operation it carries -- counted in RequestBudget (server/context.ts),
 * before anything is read. One picture a call; at up to 35 KB each, five hundred aliases in one
 * document would be an answer of some twenty-four megabytes. Ten, as the full-size avatars
 * (MEMBER_AVATARS_FULL_MAX_PER_REQUEST), for its reason: a thread may show several pictures at
 * once, and a limit ordinary use can reach gets raised by whoever hits it.
 */
export const CHAT_IMAGES_MAX_PER_REQUEST = 10

/**
 * How many pictures one HTTP request may bring with a chat message or a transfer
 * (acceptedPicture), over every alias and every operation of a batch (RequestBudget): one. Each
 * is decoded and encoded again, and a document could otherwise name one picture in its
 * variables and have it worked on hundreds of times. The wallet sends one message, or one
 * transfer, in a request.
 */
export const CHAT_IMAGES_ACCEPTED_MAX_PER_REQUEST = 1

/**
 * How many conversations one message may be forwarded into at once (Bernd, 30.09.2026, E-059 F3):
 * groups and members together. A few people, not a mailing list -- every one of them may get a
 * mail about it.
 */
export const CHAT_FORWARD_MAX_TARGETS = 5

/**
 * Whether two references name the same member. Without regard to case, the way the
 * chat columns compare the pair (utf8mb4_unicode_ci) -- a uuid written in capitals is the
 * same member, as `directChatPairKey` treats it.
 */
export const isSameChatMember = (a: ChatMemberRef, b: ChatMemberRef): boolean =>
  a.communityUuid.toLowerCase() === b.communityUuid.toLowerCase() &&
  a.gradidoId.toLowerCase() === b.gradidoId.toLowerCase()
