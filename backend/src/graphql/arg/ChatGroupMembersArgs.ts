// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ArrayMaxSize, IsArray, IsUUID, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'
import { CHAT_GROUP_MAX_MEMBERS } from '@/data/ChatGroup.logic'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * Members to be taken into a group (P5): from the caller's own contacts (E-049), each by the pair
 * the contact list holds.
 */
@ArgsType()
export class ChatGroupMembersArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  /** Capped here before a row is read, and counted against the group in the resolver. */
  @Field(() => [MemberAvatarRefInput])
  @IsArray()
  @ArrayMaxSize(CHAT_GROUP_MAX_MEMBERS - 1)
  @ValidateNested({ each: true })
  members: MemberAvatarRefInput[]
}
