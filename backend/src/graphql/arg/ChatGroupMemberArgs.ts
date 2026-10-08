// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsUUID, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** One member of a group (P5), by their pair -- to be taken out of it. */
@ArgsType()
export class ChatGroupMemberArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  member: MemberAvatarRefInput
}
