// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * How many support requests the moderator's open tab holds, as its two halves (K3): what waits
 * for the moderation and what waits for the member. The badges and the start page add them up.
 * Apart from them what waits for a resubmission still to come (K4), which neither counts. All three
 * in "Meine Gruppen" (MG2), and what the scope holds beyond them in the last two.
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

  // open or a question back outside "Meine Gruppen", not waiting; 0 where nothing is chosen
  @Field(() => Int)
  elsewhere: number

  // waiting for a resubmission outside "Meine Gruppen"; 0 where nothing is chosen
  @Field(() => Int)
  elsewhereOnResubmission: number

  // the administrator switched the support off in "Meine Gruppen" (MG5): the first three are 0
  @Field(() => Boolean)
  off: boolean
}
