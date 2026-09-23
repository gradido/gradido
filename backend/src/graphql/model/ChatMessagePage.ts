// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'
import { ChatMessage } from './ChatMessage'

/** A page of a conversation, oldest first, and whether older messages are left to load. */
@ObjectType()
export class ChatMessagePage {
  constructor(messages: ChatMessage[], hasMore: boolean) {
    this.messages = messages
    this.hasMore = hasMore
  }

  @Field(() => [ChatMessage])
  messages: ChatMessage[]

  @Field(() => Boolean)
  hasMore: boolean
}
