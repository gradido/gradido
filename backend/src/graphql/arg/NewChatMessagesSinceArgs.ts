// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive, Max, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import {
  CHAT_UPDATE_MESSAGES_DEFAULT,
  CHAT_UPDATE_MESSAGES_MAX,
} from '@/data/ChatConversation.logic'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/** Where the wallet stands in the chat, and how much it takes at once (E-017). */
@ArgsType()
export class NewChatMessagesSinceArgs {
  /**
   * The id the last answer was complete up to (its `latestId`). Absent means "I stand nowhere
   * yet": the answer then says where the caller stands and hands out no messages.
   */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  afterId?: number | null

  /** How many new messages at most; more than CHAT_UPDATE_MESSAGES_MAX is refused, not cut. */
  @Field(() => Int, { nullable: true, defaultValue: CHAT_UPDATE_MESSAGES_DEFAULT })
  @IsInt()
  @IsPositive()
  @Max(CHAT_UPDATE_MESSAGES_MAX)
  limit?: number | null
}
