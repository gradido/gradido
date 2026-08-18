// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * Where a member stands with their own name. One query rather than three, because the
 * settings page and the window at first login need overlapping parts of the same
 * answer, and none of it is worth a round trip of its own.
 *
 * `nextChangeAt` is computed, not promised: the window rolls, so what frees the next
 * slot is the oldest pick still inside it turning a year old - neither "in a year" nor
 * the turn of the calendar, both of which would make somebody wait too long.
 */
@ObjectType()
export class AliasStatus {
  @Field(() => Int)
  changesLeft: number

  @Field(() => Date, { nullable: true })
  nextChangeAt: Date | null

  /**
   * Every name this member owns. It lets the confirmation say that coming back to an
   * earlier one costs nothing - the alternative would be asking the server on every
   * keystroke for something the member could just be told once.
   */
  @Field(() => [String])
  ownAliases: string[]

  /**
   * Whether the member has answered the question about the name they hold - by typing
   * one themselves or by letting the built one stand. False means the system handed it
   * out and nobody has been asked yet, which is what brings up the window at login.
   *
   * Deliberately not called `aliasChosen`: keeping the built name settles the question
   * without being a pick, and a field that conflated the two is what made it cost one
   * of the four.
   */
  @Field(() => Boolean)
  aliasSettled: boolean
}
