// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'
import { ChatMessage } from './ChatMessage'

/**
 * A page of a conversation, oldest first, whether older messages are left to load, and whether
 * the reader muted the conversation -- everything the thread shows when it opens, in one query.
 */
@ObjectType()
export class ChatMessagePage {
  constructor(messages: ChatMessage[], hasMore: boolean, mutedByMe: boolean) {
    this.messages = messages
    this.hasMore = hasMore
    this.mutedByMe = mutedByMe
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
}
