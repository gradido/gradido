// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import { ChatMessage } from './ChatMessage'

/**
 * What is new in the chat for the member asking, in one answer for the threads and for the mark
 * in the menu (E-017): the messages since the wallet's cursor, where the cursor goes next, and
 * how many conversations hold something unread.
 *
 * It tells the caller nothing about another member beyond their messages: no read pointer of
 * anybody else, no "online", no "typing", no read receipt (E-016, E-008 invariant 2).
 */
@ObjectType()
export class ChatUpdate {
  constructor(
    latestId: number,
    unreadConversations: number,
    messages: ChatMessage[],
    hasMore: boolean,
  ) {
    this.latestId = latestId
    this.unreadConversations = unreadConversations
    this.messages = messages
    this.hasMore = hasMore
  }

  /**
   * The id this answer is complete up to -- the `afterId` of the next call. With messages it is
   * the id of the last one handed out, so under `hasMore` not the highest there is: the next
   * call goes on right after it. Without messages it is the highest id of the caller's
   * conversations, 0 without one.
   */
  @Field(() => Int)
  latestId: number

  /**
   * In how many of the caller's conversations something waits unread: people, not messages --
   * three unread messages from Lena are one thing to see to. A muted conversation counts
   * (E-024: mute is about mail, not about seeing).
   */
  @Field(() => Int)
  unreadConversations: number

  /** The new messages of all the caller's conversations, oldest first, the caller's own too. */
  @Field(() => [ChatMessage])
  messages: ChatMessage[]

  /** Whether more new messages are left over the cap; the next call starts at `latestId`. */
  @Field(() => Boolean)
  hasMore: boolean
}
