// AI-GENERATED — not an architecture reference
import { IsString, IsUUID, MaxLength } from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * A message whose writer changes its text (Bernd, 01.10.2026, E-060): which one, by its uuid, and
 * the text it is to have from now on.
 *
 * The upper bound of a chat message (SendChatMessageArgs.body) sits here. The lower one cannot:
 * a text may be emptied where the message carries a picture, and whether it does is on the row,
 * not in these arguments -- editChatMessage checks it.
 */
@ArgsType()
export class EditChatMessageArgs {
  @Field(() => String)
  @IsUUID('4')
  messageUuid: string

  @Field(() => String)
  @IsString()
  @MaxLength(MESSAGE_MAX_CHARS)
  body: string
}
