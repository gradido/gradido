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
   * ⛔ DEPRECATED, ignored, and kept on purpose for exactly one release.
   *
   * The keying switch has its own mutation now (`setCreaMatchingKeying`) and this
   * resolver does not read this field. It stays because GraphQL rejects an unknown
   * key in a variable object as a hard coercion error, and the admin bundle running
   * today still sends it: removing it outright breaks every admin tab that is open
   * across the deploy - `setCreaSettings` AND `testCreaModel`, which shares this input
   * and never read the field either.
   *
   * ⚠️ And that break is invisible in the way that matters. A coercion failure comes
   * back as `BAD_USER_INPUT`, while `useAppOutdated` raises the reload bar only for
   * `GRAPHQL_VALIDATION_FAILED` - so the admin gets a raw red toast on both buttons
   * and nothing tells them a reload would fix it.
   *
   * Delete it in the release after this one, when no bundle sends it any more.
   */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  matchingKeyingActive?: boolean | null
}
