// AI-GENERATED — not an architecture reference
import { SupportTicketMessageType } from '@enum/SupportTicketMessageType'
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * A message of a support request's thread as the moderation reads it (K2): the eleven fields the
 * admin's thread draws (ThreadMessageItem), as on ContributionMessage -- the internal notes
 * among them, and the author's row number, which tells the member's messages from the
 * moderation's.
 */
@ObjectType()
export class AdminSupportTicketMessage {
  @Field(() => Int)
  id: number

  @Field(() => String)
  message: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => SupportTicketMessageType)
  type: SupportTicketMessageType

  // Null only for a message whose author row is gone.
  @Field(() => String, { nullable: true })
  userAlias: string | null

  // The author's row number, which tells the member's messages from the moderation's.
  @Field(() => Int)
  userId: number

  @Field(() => Int, { nullable: true })
  userAvatarColorIndex: number | null

  @Field(() => String, { nullable: true })
  userGradidoID: string | null

  @Field(() => String, { nullable: true })
  userCommunityUuid: string | null

  // Null where there is nothing to show (dbFindMemberAvatarTimestamps).
  @Field(() => Date, { nullable: true })
  userAvatarUpdatedAt: Date | null

  @Field(() => Boolean)
  isModerator: boolean
}
