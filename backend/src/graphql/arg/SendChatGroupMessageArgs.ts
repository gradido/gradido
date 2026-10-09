// AI-GENERATED — not an architecture reference
import { ChatImageInput } from '@input/ChatImageInput'
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'
import { isLongEnoughForChatMessage } from '@/graphql/validator/ChatMessageBody'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * A message to a group (P5): which group, what, whether it goes out as an announcement -- by mail
 * to every member who has not muted the group (E-024, E-050 F5) -- and, where it carries one, a
 * picture (P7). No subject, as in the chat with one member (E-013).
 */
@ArgsType()
export class SendChatGroupMessageArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  /** The bounds of a chat message (SendChatMessageArgs.body). */
  @Field(() => String)
  @IsString()
  @MaxLength(MESSAGE_MAX_CHARS)
  @isLongEnoughForChatMessage()
  body: string

  /**
   * The ticked box "announcement by e-mail to all" -- for the owner and the moderators only.
   * Required, with no default, as `notify` is for one member: a variable a client forgets is
   * refused, not taken as a silent announcement -- or a silent none.
   */
  @Field(() => Boolean)
  @IsBoolean()
  announce: boolean

  /** A picture, one at most (P7), as in the chat with one member. */
  @Field(() => ChatImageInput, { nullable: true })
  @ValidateNested()
  image?: ChatImageInput | null

  /**
   * The message this one answers, by its uuid: one the sender can read in the same conversation.
   * The thread shows it as a quotation over the answer.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4')
  replyTo?: string | null
}
