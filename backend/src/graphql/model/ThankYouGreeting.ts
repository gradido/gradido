// AI-GENERATED — not an architecture reference
import { ThankYouGreetingSelect } from 'database'
import { Field, ObjectType } from 'type-graphql'

/**
 * What a thank-you greeting shows beyond its link: the motif, the first line, the name of
 * whom it is for. Readable by whoever holds the link, as the link's memo is.
 *
 * `motif` is a plain string (shared/src/data/ThankYouGreeting.logic.ts says why) and nullable: a
 * greeting may carry a picture of the member's own -- a photo -- instead.
 */
@ObjectType()
export class ThankYouGreeting {
  constructor(row: Pick<ThankYouGreetingSelect, 'motif' | 'line' | 'recipientName'>) {
    this.motif = row.motif
    this.line = row.line
    this.recipientName = row.recipientName
    this.hasPicture = row.motif === null
  }

  @Field(() => String, { nullable: true })
  motif: string | null

  /**
   * Whether the greeting carries a picture of the member's own in the motif's place: a greeting
   * has one of the two (thankYouGreetingSchema), so it is said by the row itself -- the lists
   * of links and of bookings learn it without a look at the pictures' table.
   *
   * ⛔ Only THAT there is one. The picture itself is in none of these answers: it comes by the
   * address of an open link (GET /api/thank-you-greeting-picture/…) or, to the two the
   * greeting is between, by thankYouGreetingPicture.
   */
  @Field(() => Boolean)
  hasPicture: boolean

  @Field(() => String, { nullable: true })
  line: string | null

  @Field(() => String, { nullable: true })
  recipientName: string | null
}
