// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * How many support requests the moderator's open tab holds, as its two halves (K3): what waits
 * for the moderation and what waits for the member. The badges and the start page add them up.
 */
@ObjectType()
export class AdminOpenSupportTickets {
  // open: the member wrote last, or nobody answered yet
  @Field(() => Int)
  forModeration: number

  // a question back to the member
  @Field(() => Int)
  forMember: number
}
