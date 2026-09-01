import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import { CREA_EFFORTS } from '@/apis/anthropic/crea/settings'

// Admin input for the Crea settings (DO-4). An empty/null `model` clears the override
// and falls back to the env default; `effort` must be one of the allowed levels;
// `fastMode` asks for faster output at premium pricing where the model supports it.
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

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  fastMode?: boolean | null

  /**
   * Whether Crea works out the key words of matching entries.
   *
   * ⛔ NOT optional, unlike the three above, and the difference is deliberate. They
   * fall back to a harmless default when absent; this one decides whether money is
   * spent, and a missing value would have to mean either "leave it" or "off" - both
   * of which are a guess the caller should not be allowed to make. An admin panel
   * that forgets the field gets a validation error rather than an accidental switch.
   */
  @Field()
  @IsBoolean()
  matchingKeyingActive: boolean
}
