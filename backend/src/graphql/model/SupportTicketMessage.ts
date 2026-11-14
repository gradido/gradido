// AI-GENERATED — not an architecture reference
import { SupportTicketMessageType } from '@enum/SupportTicketMessageType'
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * A message of a support request's thread as the member reads it: the nine fields the wallet's
 * thread draws (ContributionMessagesListItem), as on ContributionMessage -- the author's
 * username, the colour digit of their circle, the pair that names a member, and when they last
 * changed the picture other members may see. No row number of anybody.
 */
@ObjectType()
export class SupportTicketMessage {
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

  @Field(() => Int, { nullable: true })
  userAvatarColorIndex: number | null

  @Field(() => String, { nullable: true })
  userGradidoID: string | null

  @Field(() => String, { nullable: true })
  userCommunityUuid: string | null

  // Null where there is nothing to show (dbFindMemberAvatarTimestamps), and on the member's own
  // message the write answers: the wallet draws the member's own face from its store.
  @Field(() => Date, { nullable: true })
  userAvatarUpdatedAt: Date | null
}
