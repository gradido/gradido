// AI-GENERATED — not an architecture reference
import { IsString, IsUUID, MaxLength } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'
import { CHAT_GROUP_TITLE_INPUT_MAX } from '@/data/ChatGroup.logic'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/** A group (P5) and the name it is to have. */
@ArgsType()
export class RenameChatGroupArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  /** The name as typed; what is kept of it, and whether it is kept, chatGroupTitle decides. */
  @Field(() => String)
  @IsString()
  @MaxLength(CHAT_GROUP_TITLE_INPUT_MAX)
  title: string
}
