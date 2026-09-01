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
   * Absent means LEAVE IT, which is a contract rather than a guess - the resolver
   * writes nothing when the field is missing, and reads the stored value back for the
   * answer. The other two readings, "off" and "the default", would both be guesses
   * about a setting that costs money, and this one is neither.
   *
   * ⛔ Nullable for a reason that only shows up during a deploy. `CreaSettingsInput`
   * is also the argument of `testCreaModel`, which never reads this field - so a
   * required `Boolean!` would reject BOTH mutations for any admin bundle loaded
   * before the field existed, including the probe button that touches nothing. The
   * admin panel has no service worker and no version check, so that browser tab is
   * simply broken until somebody reloads it.
   *
   * ⚠️ The resolver tests `!= null`, not falsiness: `false` is the value that turns
   * the spending OFF, and dropping it would make the switch one-way.
   */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  matchingKeyingActive?: boolean | null
}
