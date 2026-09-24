// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsInt, IsPositive, Max, ValidateNested } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import { CHAT_MESSAGES_PAGE_DEFAULT, CHAT_MESSAGES_PAGE_MAX } from '@/data/ChatConversation.logic'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/**
 * Which conversation, and which page of it: the other member by their pair -- the only thing
 * the contact window knows about them (KF-004) -- and the messages before `before`.
 */
@ArgsType()
export class ChatMessagesWithMemberArgs {
  @Field(() => MemberAvatarRefInput)
  @ValidateNested()
  ref: MemberAvatarRefInput

  /** The id of the oldest message on screen; absent for the newest page. */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsPositive()
  before?: number | null

  /** How many messages; more than CHAT_MESSAGES_PAGE_MAX is refused, not cut. */
  @Field(() => Int, { nullable: true, defaultValue: CHAT_MESSAGES_PAGE_DEFAULT })
  @IsInt()
  @IsPositive()
  @Max(CHAT_MESSAGES_PAGE_MAX)
  limit?: number | null
}
