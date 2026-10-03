// AI-GENERATED — not an architecture reference
import { IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

/**
 * What makes a transaction link a thank-you greeting, as the wallet sends it with
 * createTransactionLink: the motif of the card, its first line, and the name of whom it is
 * for. Only the motif is required.
 *
 * The decorators here say the shape and nothing else -- with `forbidUnknownValues` a nested
 * input without any is refused whole. What a greeting may hold is checked by
 * `transactionLinkGreetingSchema` (data/ThankYouGreeting.schema.ts), together with the memo
 * its line has to begin.
 */
@InputType()
export class ThankYouGreetingInput {
  @Field(() => String)
  @IsString()
  motif: string

  @Field(() => String, { nullable: true })
  @IsString()
  line?: string | null

  @Field(() => String, { nullable: true })
  @IsString()
  recipientName?: string | null
}
