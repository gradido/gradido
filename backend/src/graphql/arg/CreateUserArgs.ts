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

  // The alias from the Gradido address the registration started at (/u/<alias>). Checked
  // by createUserSchema (aliasSchema), not by a validator here: the schema answers with the
  // message the form knows. The wallet sends only a user name (Register.vue).
  @Field(() => String, { nullable: true })
  @IsString()
  referrerAlias?: string | null

  // The guarantor code (E-017) from the card the guest scanned, `?guarantor=` on the address.
  // Checked in the resolver against `referrerAlias`, because that is whose code it must be.
  @Field(() => String, { nullable: true })
  @IsString()
  guarantorCode?: string | null

  // Only together with a guarantor code. Length and strength are checked by `passwordSchema` (shared)
  // in createUserSchema, not by a validator here: the schema answers with the message the form
  // knows, a validator on the argument with a raw "Argument Validation Error".
  @Field(() => String, { nullable: true })
  @IsString()
  password?: string | null
}
