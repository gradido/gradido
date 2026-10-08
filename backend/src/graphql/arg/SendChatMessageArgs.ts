// AI-GENERATED — not an architecture reference
import { ChatMessageNotify } from '@enum/ChatMessageNotify'
import { ChatImageInput } from '@input/ChatImageInput'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsEnum, IsString, MaxLength, ValidateNested } from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'
import { isLongEnoughForChatMessage } from '@/graphql/validator/ChatMessageBody'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * A chat message to one member: who, what, and whether it should reach them as a mail as well --
 * and, where it carries one, a picture (P7). No subject -- a message written in the chat has none
 * (E-013).
 */
@ArgsType()
export class SendChatMessageArgs {
  /** The recipient, by the pair the contact window holds (KF-004). */
  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  ref: MemberAvatarRefInput

  /**
   * The same bounds as the form "send an e-mail" (SendEmailArgs.memo) -- except that a message
   * with a picture may have no text at all (isLongEnoughForChatMessage).
   */
  @Field(() => String)
  @IsString()
  @MaxLength(MESSAGE_MAX_CHARS)
  @isLongEnoughForChatMessage()
  body: string

  /**
   * The sender's wish (E-024): EMAIL for a ticked "also by e-mail", NONE for an empty one.
   * Required, with no default: a variable a client forgets is refused, not taken as a silent
   * mail -- or a silent none.
   */
  @Field(() => ChatMessageNotify)
  @IsEnum(ChatMessageNotify)
  notify: ChatMessageNotify

  /**
   * A picture, one at most (P7) -- the table has room for several in one message, the argument
   * takes one. Within this community only until the next step (P7b): to a member of another
   * one, a message with a picture is refused (sendChatMessage).
   */
  @Field(() => ChatImageInput, { nullable: true })
  @ValidateNested()
  image?: ChatImageInput | null
}
