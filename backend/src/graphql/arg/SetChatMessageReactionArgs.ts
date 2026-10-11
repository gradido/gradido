// AI-GENERATED — not an architecture reference
import { IsString, IsUUID, MaxLength } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * A member's reaction to a chat message (migration 0158): which message, by its uuid, and the
 * emoji -- or none, to take the reaction back.
 *
 * The bound is the column's (chat_message_reactions.emoji). Which emoji is one a member may react
 * with is not a matter of length: setChatMessageReaction holds it against the list
 * (chatReactionEmojiSchema).
 */
@ArgsType()
export class SetChatMessageReactionArgs {
  @Field(() => String)
  @IsUUID('4')
  messageUuid: string

  /** Absent or null takes the caller's reaction back. */
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(16)
  emoji?: string | null
}
