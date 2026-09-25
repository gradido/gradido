// AI-GENERATED — not an architecture reference
import { ChatMessageNotify } from '@enum/ChatMessageNotify'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsEnum, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/**
 * A chat message to one member: who, what, and whether it should reach them as a mail as well.
 * No subject -- a message written in the chat has none (E-013).
 */
@ArgsType()
export class SendChatMessageArgs {
  /** The recipient, by the pair the contact window holds (KF-004). */
  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  ref: MemberAvatarRefInput

  /** The same bounds as the form "send an e-mail" (SendEmailArgs.memo). */
  @Field(() => String)
  @IsString()
  @MaxLength(MESSAGE_MAX_CHARS)
  @MinLength(MESSAGE_MIN_CHARS)
  body: string

  /**
   * The sender's wish (E-024): EMAIL for a ticked "also by e-mail", NONE for an empty one.
   * Required, with no default: a variable a client forgets is refused, not taken as a silent
   * mail -- or a silent none.
   */
  @Field(() => ChatMessageNotify)
  @IsEnum(ChatMessageNotify)
  notify: ChatMessageNotify
}
