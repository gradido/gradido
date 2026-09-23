// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsInt, IsPositive, ValidateNested } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/** The conversation with this member, read up to this message (E-017). */
@ArgsType()
export class MarkChatConversationReadArgs {
  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  ref: MemberAvatarRefInput

  /**
   * The highest message id the member was SHOWN -- not the highest there is, which would take
   * a message that arrived after the page was loaded as read.
   */
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  upToMessageId: number
}
