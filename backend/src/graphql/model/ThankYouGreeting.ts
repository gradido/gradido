// AI-GENERATED — not an architecture reference
import { ThankYouGreetingSelect } from 'database'
import { Field, ObjectType } from 'type-graphql'

/**
 * What a thank-you greeting shows beyond its link: the motif, the first line, the name of
 * whom it is for. Readable by whoever holds the link, as the link's memo is.
 *
 * `motif` is a plain string (data/ThankYouGreeting.logic.ts says why) and nullable: a
 * greeting may carry a photo of the member's own instead, once there is one.
 */
@ObjectType()
export class ThankYouGreeting {
  constructor(row: Pick<ThankYouGreetingSelect, 'motif' | 'line' | 'recipientName'>) {
    this.motif = row.motif
    this.line = row.line
    this.recipientName = row.recipientName
  }

  @Field(() => String, { nullable: true })
  motif: string | null

  @Field(() => String, { nullable: true })
  line: string | null

  @Field(() => String, { nullable: true })
  recipientName: string | null
}
