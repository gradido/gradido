// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import { ChatMessage } from './ChatMessage'

/**
 * A page of a conversation, oldest first, whether older messages are left to load, whether the
 * reader muted the conversation, and how far the other member has read it -- everything the thread
 * shows when it opens, in one query.
 */
@ObjectType()
export class ChatMessagePage {
  constructor(
    messages: ChatMessage[],
    hasMore: boolean,
    mutedByMe: boolean,
    partnerReadUpTo: number | null = null,
  ) {
    this.messages = messages
    this.hasMore = hasMore
    this.mutedByMe = mutedByMe
    this.partnerReadUpTo = partnerReadUpTo
  }

  @Field(() => [ChatMessage])
  messages: ChatMessage[]

  @Field(() => Boolean)
  hasMore: boolean

  /**
   * Whether the READER muted the conversation (E-024): their own mark, and only theirs. Whether
   * the other member muted it shows only where that held back a mail the reader asked for: that
   * message of the reader's says MUTED (ChatMessage.mailState, E-034).
   */
  @Field(() => Boolean)
  mutedByMe: boolean

  /**
   * Up to which message the OTHER member of a conversation of two has read it (Chat E-093, the two
   * ticks): their read pointer, 0 where they have read nothing yet. Null where this server cannot
   * know -- a member of another community, whose pointer never moves here -- and in a group, whose
   * pointers stay its members' own (E-008, invariant 2).
   */
  @Field(() => Int, { nullable: true })
  partnerReadUpTo: number | null
}
