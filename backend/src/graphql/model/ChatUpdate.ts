// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import { ChatMessage } from './ChatMessage'

/**
 * What is new in the chat for the member asking, in one answer for the threads and for the mark
 * in the menu (E-017): the messages since the wallet's cursor, where the cursor goes next, and
 * how many conversations hold something unread -- and the messages whose text was changed
 * (E-060) and those whose reactions were (migration 0158), each with where to go on from next.
 *
 * And how far the members named in `readBy` -- the wallet names those whose conversation of two
 * it has open -- have read their conversation with the caller (Chat E-093, the two ticks). No
 * field says when, and none says "online" or "typing"; but who keeps asking sees the number move
 * within one question of the reading, so roughly when the other member had the conversation open
 * and in sight. Of a group nobody's pointer, which stays its members' own (E-008, invariant 2).
 */
@ObjectType()
export class ChatUpdate {
  constructor(
    latestId: number,
    unreadConversations: number,
    messages: ChatMessage[],
    hasMore: boolean,
    edited: ChatMessage[],
    editedCursor: string,
    reacted: ChatMessage[],
    reactedCursor: string,
    unreadTransfers: number,
    latestUnreadTransferId: number | null,
    readUpTo: Array<number | null>,
  ) {
    this.latestId = latestId
    this.unreadConversations = unreadConversations
    this.messages = messages
    this.hasMore = hasMore
    this.edited = edited
    this.editedCursor = editedCursor
    this.reacted = reacted
    this.reactedCursor = reactedCursor
    this.unreadTransfers = unreadTransfers
    this.latestUnreadTransferId = latestUnreadTransferId
    this.readUpTo = readUpTo
  }

  /**
   * Where the next call goes on from -- its `afterId`. With messages it is the id of the last one
   * handed out, so under `hasMore` not the highest there is: the next call goes on right after
   * it. Without messages it is the highest id of the caller's conversations, 0 without one.
   * Not a promise that nothing with a lower id comes later: see
   * ChatResolver.newChatMessagesSince.
   */
  @Field(() => Int)
  latestId: number

  /**
   * In how many of the caller's conversations something waits unread: people, not messages --
   * three unread messages from Lena are one thing to see to. A muted conversation counts
   * (E-024: mute is about mail, not about seeing). A person who sent the caller a transfer they
   * have not seen counts too, and once, whether a message of theirs waits as well or not (Chat
   * E-086).
   */
  @Field(() => Int)
  unreadConversations: number

  /** The new messages of all the caller's conversations, oldest first, the caller's own too. */
  @Field(() => [ChatMessage])
  messages: ChatMessage[]

  /** Whether more new messages are left over the cap; the next call starts at `latestId`. */
  @Field(() => Boolean)
  hasMore: boolean

  /**
   * The messages of all the caller's conversations whose text was changed since the caller's
   * `editedCursor` (E-060), in the order they were changed, the caller's own too -- each as it
   * stands now, to take the place of the one the wallet holds. Empty for a call without
   * `editedCursor`. ⚠️ A message may come again with a later call, unchanged: the wallet takes it
   * as it is.
   */
  @Field(() => [ChatMessage])
  edited: ChatMessage[]

  /**
   * Where the next call goes on from for changed messages -- its `editedCursor`, to be handed
   * back as it is. What it names is this server's alone (ChatResolver.newChatMessagesSince).
   */
  @Field(() => String)
  editedCursor: string

  /**
   * The messages of all the caller's conversations whose reactions were changed since the caller's
   * `reactedCursor` (migration 0158) -- set, replaced or taken back, the caller's own too --, in
   * the order that happened, each as it stands now: its `reactions` take the place of the ones
   * the wallet holds. Empty for a call without `reactedCursor`. ⚠️ A message may come again with
   * a later call, unchanged, as a changed text does; its `reactedAt` says which answer is the
   * later one.
   */
  @Field(() => [ChatMessage])
  reacted: ChatMessage[]

  /**
   * Where the next call goes on from for reactions -- its `reactedCursor`, to be handed back as
   * it is. Its own cursor beside `editedCursor`: the two clocks go each their own way.
   */
  @Field(() => String)
  reactedCursor: string

  /**
   * How many transfers the caller received and has not seen (Chat E-086): none where they switched
   * transfers out of their conversations. With `latestUnreadTransferId` what the wallet asks its
   * lists again on: a transfer that arrives raises both, one that is seen lowers this.
   */
  @Field(() => Int)
  unreadTransfers: number

  /** The newest transfer the caller received and has not seen, by its id; null where none waits. */
  @Field(() => Int, { nullable: true })
  latestUnreadTransferId: number | null

  /**
   * How far each member named in `readBy` has read in their conversation with the caller (Chat
   * E-093), in the order they were named: their read pointer, 0 where they have read nothing or
   * there is no conversation, and null where this server cannot know -- a member of another
   * community (partnerReadUpTo). Empty without `readBy`.
   */
  @Field(() => [Int], { nullable: 'items' })
  readUpTo: Array<number | null>
}
