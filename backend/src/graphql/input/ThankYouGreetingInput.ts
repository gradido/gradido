// AI-GENERATED — not an architecture reference
import { IsString, ValidateNested } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import { ChatImageInput } from './ChatImageInput'

/**
 * What makes a transaction link a thank-you greeting, as the wallet sends it with
 * createTransactionLink: the motif of the card or a picture of the member's own in its place,
 * its first line, and the name of whom it is for. One of motif and picture is required, and
 * only one.
 *
 * The decorators here say the shape and nothing else -- with `forbidUnknownValues` a nested
 * input without any is refused whole. What a greeting may hold is checked by
 * `transactionLinkGreetingSchema` (data/ThankYouGreeting.schema.ts), together with the memo
 * its line has to begin.
 */
@InputType()
export class ThankYouGreetingInput {
  @Field(() => String, { nullable: true })
  @IsString()
  motif?: string | null

  /**
   * The small rendition of the member's own photo, in the form a chat message's picture comes
   * in -- JPEG as base64, and its size -- and with its bounds (ChatImageInput): it is what the
   * conversation of the two shows once the greeting is accepted. The large rendition follows
   * in a request of its own (addThankYouGreetingPicture).
   */
  @Field(() => ChatImageInput, { nullable: true })
  @ValidateNested()
  picture?: ChatImageInput | null

  @Field(() => String, { nullable: true })
  @IsString()
  line?: string | null

  @Field(() => String, { nullable: true })
  @IsString()
  recipientName?: string | null
}
