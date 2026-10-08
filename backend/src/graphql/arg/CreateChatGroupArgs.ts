// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ArrayMaxSize, IsArray, IsString, MaxLength, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'
import { CHAT_GROUP_MAX_MEMBERS, CHAT_GROUP_TITLE_INPUT_MAX } from '@/data/ChatGroup.logic'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * A new group (P5): its name and the members the founder takes in -- from their own contacts
 * (E-049), each by the pair the contact list holds. The founder is its owner and not named here.
 */
@ArgsType()
export class CreateChatGroupArgs {
  /** The name as typed; what is kept of it, and whether it is kept, chatGroupTitle decides. */
  @Field(() => String)
  @IsString()
  @MaxLength(CHAT_GROUP_TITLE_INPUT_MAX)
  title: string

  /**
   * The size limit sits here as well as in the resolver: this one refuses an oversized list
   * before a single row is read, the resolver's counts each member once (MemberAvatarsArgs).
   */
  @Field(() => [MemberAvatarRefInput])
  @IsArray()
  @ArrayMaxSize(CHAT_GROUP_MAX_MEMBERS - 1)
  @ValidateNested({ each: true })
  members: MemberAvatarRefInput[]
}
