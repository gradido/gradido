// AI-GENERATED — not an architecture reference
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { MEMO_MAX_CHARS } from 'shared'
import { Field, InputType } from 'type-graphql'

/**
 * One entry of the first creation: a catalog key plus the member's free text — or a
 * tick (catalog key of a check sentence, no text). The sentence itself is built on the
 * server from the key, so no client can send a stem of its own.
 */
@InputType()
export class FirstCreationEntryInput {
  @Field()
  @IsString()
  @MaxLength(64)
  catalogKey: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(MEMO_MAX_CHARS)
  text?: string | null
}
