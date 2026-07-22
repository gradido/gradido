import { IsIn, IsOptional, IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import { CREA_EFFORTS } from '@/apis/anthropic/crea/settings'

// Admin input for the Crea settings (DO-4). An empty/null `model` clears the override
// and falls back to the env default; `effort` must be one of the allowed levels.
@InputType()
export class CreaSettingsInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  model?: string | null

  @Field()
  @IsString()
  @IsIn([...CREA_EFFORTS])
  effort: string
}
