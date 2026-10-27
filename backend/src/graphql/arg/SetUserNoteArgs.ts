// AI-GENERATED — not an architecture reference
import { UserNoteSubjectInput } from '@input/UserNoteSubjectInput'
import { IsString, MaxLength, ValidateNested } from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** A member's own note on a person or a group, written anew; an emptied note takes it away. */
@ArgsType()
export class SetUserNoteArgs {
  @Field(() => UserNoteSubjectInput)
  @ValidateNested()
  about: UserNoteSubjectInput

  /** As long as a chat message may be: what the wallet's field lets through. Empty is allowed. */
  @Field(() => String)
  @IsString()
  @MaxLength(MESSAGE_MAX_CHARS)
  note: string
}
