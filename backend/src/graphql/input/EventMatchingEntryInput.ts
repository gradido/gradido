// AI-GENERATED — not an architecture reference
import { IsBoolean, IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

/**
 * The entry an event link offers (Event-Matching), as a registration brings it along: the
 * wallet read it off `/event?interest=…` and sends it with `createUser`. Always an interest --
 * "I love ‹summary›" -- so it names no kind.
 *
 * The decorators here say the shape and nothing else -- with `forbidUnknownValues` a nested
 * input without any is refused whole (ThankYouGreetingInput). What an entry may hold is
 * checked by `eventMatchingEntrySchema` (createUser.schema), with everything else a
 * registration brings: the schema answers with what it took, a validator here with a bare
 * "Argument Validation Error".
 */
@InputType()
export class EventMatchingEntryInput {
  @Field(() => String)
  @IsString()
  summary: string

  @Field(() => String, { nullable: true })
  @IsString()
  details?: string | null

  // Whether the entry is found from afar as well. The link's own default -- found from afar
  // where it says nothing -- is the wallet's to apply: here the answer is always given.
  @Field(() => Boolean)
  @IsBoolean()
  remote: boolean
}
