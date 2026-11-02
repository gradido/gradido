// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsInt, IsPositive, ValidateNested } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** The transfers received from this member, seen up to this booking (Chat E-086). */
@ArgsType()
export class MarkChatTransfersSeenArgs {
  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  ref: MemberAvatarRefInput

  /**
   * The newest received transfer the conversation SHOWED, by the id of the member's RECEIVE
   * booking -- not the newest there is, which would take one that arrived after the thread was
   * loaded as seen.
   */
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  upToTransactionId: number
}
