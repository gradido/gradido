// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * How many support requests the moderator's open tab holds, as its two halves (K3): what waits
 * for the moderation and what waits for the member. The badges and the start page add them up.
 * Apart from them what waits for a resubmission still to come (K4), which neither counts.
 */
@ObjectType()
export class AdminOpenSupportTickets {
  // open: the member wrote last, or nobody answered yet
  @Field(() => Int)
  forModeration: number

  // a question back to the member
  @Field(() => Int)
  forMember: number

  // open or a question back, and waiting for a resubmission still to come
  @Field(() => Int)
  onResubmission: number
}
