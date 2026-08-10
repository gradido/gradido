// AI-GENERATED — not an architecture reference
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { MATCHING_ENTRY_DETAILS_MAX_CHARS } from 'shared'
import { Field, InputType } from 'type-graphql'

@InputType()
export class MatchingEntryInput {
  @Field(() => String)
  @IsString()
  @IsIn(['offer', 'need', 'interest'])
  matchingType: string

  @Field(() => String)
  @IsString()
  @MaxLength(160)
  summary: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(MATCHING_ENTRY_DETAILS_MAX_CHARS)
  details?: string | null

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  remote?: boolean
}
