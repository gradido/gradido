// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * What waits for the moderation in the moderator's own groups ("Meine Gruppen", MG3): the lines
 * "n warten auf die Moderation" of the admin's start page, for the two numbers at "Admin" in
 * the wallet's menu. A number is null where it is not the caller's to count.
 */
@ObjectType()
export class ModerationWaiting {
  // creations waiting for the moderation (PENDING, no resubmission to come)
  @Field(() => Int, { nullable: true })
  creations: number | null

  // support requests waiting for the moderation (OPEN, no resubmission to come); null without
  // the right to handle them
  @Field(() => Int, { nullable: true })
  supportTickets: number | null
}
