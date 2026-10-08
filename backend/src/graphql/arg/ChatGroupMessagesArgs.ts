// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive, IsUUID, Max } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import { CHAT_MESSAGES_PAGE_DEFAULT, CHAT_MESSAGES_PAGE_MAX } from '@/data/ChatConversation.logic'

// TODO: replace the class-validator decorators with a valibot schema

/** Which group, and which page of it: the messages before `before` -- as for a thread. */
@ArgsType()
export class ChatGroupMessagesArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  /** The id of the oldest message on screen; absent for the newest page. */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsPositive()
  before?: number | null

  /** How many messages; more than CHAT_MESSAGES_PAGE_MAX is refused, not cut. */
  @Field(() => Int, { nullable: true, defaultValue: CHAT_MESSAGES_PAGE_DEFAULT })
  @IsInt()
  @IsPositive()
  @Max(CHAT_MESSAGES_PAGE_MAX)
  limit?: number | null
}
