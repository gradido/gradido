// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive, Matches, Max, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import {
  CHAT_EDITS_CURSOR_PATTERN,
  CHAT_UPDATE_MESSAGES_DEFAULT,
  CHAT_UPDATE_MESSAGES_MAX,
} from '@/data/ChatConversation.logic'

// TODO: replace the class-validator decorators with a valibot schema

/** Where the wallet stands in the chat, and how much it takes at once (E-017). */
@ArgsType()
export class NewChatMessagesSinceArgs {
  /**
   * Where the last answer said to go on from (its `latestId`). Absent means "I stand nowhere
   * yet": the answer then says where the caller stands and hands out no messages.
   */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  afterId?: number | null

  /**
   * How many new messages at most, and as many changed ones; more than CHAT_UPDATE_MESSAGES_MAX
   * is refused, not cut.
   */
  @Field(() => Int, { nullable: true, defaultValue: CHAT_UPDATE_MESSAGES_DEFAULT })
  @IsInt()
  @IsPositive()
  @Max(CHAT_UPDATE_MESSAGES_MAX)
  limit?: number | null

  /**
   * From where on the caller wants the messages whose text was changed (E-060): what the last
   * answer handed on (its `editedCursor`), as it came. Absent means "I have asked for none yet":
   * the answer then says where to go on from, and hands out no changed messages -- as `afterId`
   * does for the new ones, each of the two for itself.
   */
  @Field(() => String, { nullable: true })
  @Matches(CHAT_EDITS_CURSOR_PATTERN)
  editedCursor?: string | null
}
