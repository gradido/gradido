// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsBoolean, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/** The conversation with this member, muted or not (E-024). */
@ArgsType()
export class SetChatConversationMutedArgs {
  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  ref: MemberAvatarRefInput

  @Field(() => Boolean)
  @IsBoolean()
  muted: boolean
}
