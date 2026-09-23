import { IsEmail, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class CreateUserArgs {
  @Field(() => String, { nullable: true })
  @IsString()
  alias?: string | null

  @Field(() => String)
  @IsEmail()
  email: string

  @Field(() => String)
  @IsString()
  firstName: string

  @Field(() => String)
  @IsString()
  lastName: string

  @Field(() => String, { nullable: true })
  @IsString()
  language?: string | null

  @Field(() => Int, { nullable: true })
  @IsInt()
  publisherId?: number | null

  @Field(() => String, { nullable: true })
  @IsString()
  redeemCode?: string | null

  @Field(() => String, { nullable: true })
  @IsString()
  project?: string | null

  // The alias from the Gradido address the registration started at (/u/<alias>).
  // Deliberately without a length check: the address may carry a gradido ID instead,
  // and a validation error here would fail the whole registration. Whatever is not
  // alias-shaped is ignored where it is resolved (registerAccount).
  @Field(() => String, { nullable: true })
  @IsString()
  referrerAlias?: string | null

  // The table code (E-017) from the card the guest scanned, `?presence=` on the address.
  // Checked in the resolver against `referrerAlias`, because that is whose code it must be.
  @Field(() => String, { nullable: true })
  @IsString()
  presenceCode?: string | null

  // Only together with a valid table code; without one the resolver refuses it rather than
  // dropping it. Length and strength are checked there too (`isValidPassword`), not by a
  // validator here: the resolver answers with the message the form knows, a validator on the
  // argument with a raw "Argument Validation Error".
  @Field(() => String, { nullable: true })
  @IsString()
  password?: string | null
}
