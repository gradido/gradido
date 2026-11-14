import { Transaction as dbTransaction, User as dbUser } from 'database'
import { GradidoUnit } from 'shared'

import { Role } from '@/auth/Role'

import { LogError } from './LogError'

/**
 * What one HTTP request has been served so far.
 *
 * One HTTP request is one operation -- the server takes no POST that carries several -- and
 * the context function makes one context for it. What is left to count is the aliases: a
 * document may ask for the same field any number of times under other names. Only at the root:
 * below it validationRules.ts rejects every alias, and it caps the root fields of an operation.
 */
export interface RequestBudget {
  // Full-size member pictures, capped at MEMBER_AVATARS_FULL_MAX_PER_REQUEST.
  memberAvatarsFullServed: number
  // The member's own picture, or their own picture of a contact, taken in (setUserAvatar,
  // setKeptPicture), capped together at USER_AVATARS_ACCEPTED_MAX_PER_REQUEST: both renditions
  // are decoded and encoded again.
  userAvatarsAccepted: number
  // Other communities asked by memberAvatars, capped at MEMBER_AVATARS_RELAYS_MAX_PER_REQUEST.
  memberAvatarsRelayed: number
  // Links of other communities asked of them (queryTransactionLink), capped at
  // FOREIGN_TRANSACTION_LINKS_MAX_PER_REQUEST.
  foreignTransactionLinksAsked: number
  // Pages of a chat thread or of a group (chatMessagesWithMember, chatGroupMessages), capped
  // together at CHAT_MESSAGE_PAGES_MAX_PER_REQUEST.
  chatMessagePagesServed: number
  // Lists of groups and of their members (chatGroups, chatGroupMembers), capped together at
  // CHAT_GROUP_LISTS_MAX_PER_REQUEST.
  chatGroupListsServed: number
  // What is new in the chat (newChatMessagesSince), capped at CHAT_UPDATES_MAX_PER_REQUEST.
  chatUpdatesServed: number
  // Video rooms handed out (chatVideoRoom), capped at CHAT_VIDEO_ROOMS_MAX_PER_REQUEST.
  chatVideoRoomsServed: number
  // Pictures of chat messages (chatMessageImage), capped at CHAT_IMAGES_MAX_PER_REQUEST.
  chatImagesServed: number
  // Pictures taken in with a chat message or a transfer (acceptedPicture), capped together at
  // CHAT_IMAGES_ACCEPTED_MAX_PER_REQUEST: each is decoded and encoded again.
  chatImagesAccepted: number
  // Pictures of thank-you greetings (thankYouGreetingPicture), capped at
  // THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST. A call that asks for the large rendition
  // counts as THANK_YOU_GREETING_LARGE_PICTURE_COUNTS of them.
  thankYouGreetingPicturesServed: number
  // Pictures of thank-you greetings taken in (createTransactionLink with a picture,
  // addThankYouGreetingPicture), capped together at
  // THANK_YOU_GREETING_PICTURES_ACCEPTED_MAX_PER_REQUEST: each is decoded and encoded again.
  thankYouGreetingPicturesAccepted: number
  // The calls among them that asked for the large rendition, capped at
  // THANK_YOU_GREETING_LARGE_PICTURES_MAX_PER_REQUEST.
  thankYouGreetingLargePicturesServed: number
  // Photos sent with a transfer (transactionPicture), capped at
  // TRANSACTION_PICTURES_MAX_PER_REQUEST.
  transactionPicturesServed: number
  // Faces of the members who made a link, on the page of an open link (queryTransactionLink),
  // capped at SENDER_AVATARS_MAX_PER_REQUEST. Counted for every open link of a member whose
  // account stands, before the face is looked up -- with or without one to show, and past the
  // cap as well; the answer of such a request stays out of the log.
  senderAvatarsServed: number
  // Reactions to chat messages set or taken back (setChatMessageReaction), capped at
  // CHAT_REACTIONS_MAX_PER_REQUEST: each is a transaction.
  chatReactionsSet: number
  // Reactions to transfers set or taken back (setTransactionReaction), capped at
  // TRANSACTION_REACTIONS_MAX_PER_REQUEST.
  transactionReactionsSet: number
  // A member's own notes read or written (userNote, userNotes, setUserNote), capped at
  // USER_NOTES_MAX_PER_REQUEST. The answer of a request that read one stays out of the log.
  userNotesServed: number
  // The moderation's remarks on members read or written (userRemark, setUserRemark), capped at
  // USER_REMARKS_MAX_PER_REQUEST. The answer of a request that read one stays out of the log.
  userRemarksServed: number
  // Lists and threads of support requests read (listSupportTickets, listSupportTicketMessages),
  // capped together at SUPPORT_TICKET_READS_MAX_PER_REQUEST. The answer of a request that read
  // one stays out of the log.
  supportTicketReadsServed: number
  // Writes of the support (createSupportTicket, createSupportTicketMessage, closeSupportTicket),
  // capped together at SUPPORT_TICKET_WRITES_MAX_PER_REQUEST. The answer of a request that wrote
  // stays out of the log: it carries the words.
  supportTicketWritesServed: number
  // A member's own pictures of their contacts read (keptPictures, keptPictureFull), capped at
  // KEPT_PICTURES_MAX_PER_REQUEST; the list counts as KEPT_PICTURE_LIST_COUNTS. The answer of a
  // request that read one stays out of the log.
  keptPicturesServed: number
  // Profile pictures handed out: the member's own (avatar, avatarFull) and those of other
  // members (memberAvatars). Not a cap -- memberAvatars caps its members, memberAvatarFull counts
  // in memberAvatarsFullServed. The answer of a request that was handed one stays out of the log.
  profilePicturesServed: number
}

/** A budget with nothing spent. The context function creates one per HTTP request. */
export const newRequestBudget = (): RequestBudget => ({
  memberAvatarsFullServed: 0,
  userAvatarsAccepted: 0,
  memberAvatarsRelayed: 0,
  foreignTransactionLinksAsked: 0,
  chatMessagePagesServed: 0,
  chatGroupListsServed: 0,
  chatUpdatesServed: 0,
  chatVideoRoomsServed: 0,
  chatImagesServed: 0,
  chatImagesAccepted: 0,
  thankYouGreetingPicturesServed: 0,
  thankYouGreetingPicturesAccepted: 0,
  thankYouGreetingLargePicturesServed: 0,
  transactionPicturesServed: 0,
  senderAvatarsServed: 0,
  chatReactionsSet: 0,
  transactionReactionsSet: 0,
  userNotesServed: 0,
  userRemarksServed: 0,
  supportTicketReadsServed: 0,
  supportTicketWritesServed: 0,
  keptPicturesServed: 0,
  profilePicturesServed: 0,
})

export interface Context {
  token: string | null
  setHeaders: { key: string; value: string }[]
  role?: Role
  user?: dbUser
  clientTimezoneOffset?: number
  gradidoID?: string
  // hack to use less DB calls for Balance Resolver
  lastTransaction?: dbTransaction | null
  balanceGDT?: number | null
  transactionCount?: number
  linkCount?: number
  sumHoldAvailableDecayedAmount?: GradidoUnit
  // ⛔ Per HTTP request, not per field -- see RequestBudget. A cap written inside one resolver
  // call counts to one every time, because a document may ask for the same field under any
  // number of aliases. The batched reader next to it caps the LIST it is handed instead
  // (MEMBER_AVATARS_MAX_REFS), which holds only because the list travels as one argument.
  requestBudget: RequestBudget
}

export const context = ({ request }: { request: Request }): Context => {
  const authorization = request.headers.get('authorization')
  const clientTimezoneOffset = request.headers.get('clienttimezoneoffset')
  const context: Context = {
    token: null,
    setHeaders: [],
    requestBudget: newRequestBudget(),
  }
  if (authorization) {
    context.token = authorization.replace(/^Bearer /, '')
  }
  if (clientTimezoneOffset) {
    context.clientTimezoneOffset = Number(clientTimezoneOffset)
  }
  return context
}

export const getUser = (context: Context): dbUser => {
  if (context.user) {
    return context.user
  }
  throw new LogError('No user given in context')
}

export const getRole = (context: Context): Role => {
  if (context.role) {
    return context.role
  }
  throw new LogError('No role given in context')
}

export const getClientTimezoneOffset = (context: Context): number => {
  if (
    (context.clientTimezoneOffset || context.clientTimezoneOffset === 0) &&
    Math.abs(context.clientTimezoneOffset) <= 27 * 60
  ) {
    return context.clientTimezoneOffset
  }
  throw new LogError('No valid client time zone offset in context')
}
