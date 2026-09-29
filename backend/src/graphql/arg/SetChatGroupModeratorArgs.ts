// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsBoolean, IsUUID, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/** One member of a group (P5), made a moderator or a plain member again (E-050 F4). */
@ArgsType()
export class SetChatGroupModeratorArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  member: MemberAvatarRefInput

  @Field(() => Boolean)
  @IsBoolean()
  moderator: boolean
}
