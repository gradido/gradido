// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * How much room a member has left to pick a name, and when the next pick becomes
 * possible if they have none. The date is computed rather than promised: the window
 * rolls, so it is the oldest pick still inside it that frees a slot - not the turn of
 * the year and not "in a year".
 */
@ObjectType()
export class AliasQuota {
  @Field(() => Int)
  changesLeft: number

  @Field(() => Date, { nullable: true })
  nextChangeAt: Date | null
}
