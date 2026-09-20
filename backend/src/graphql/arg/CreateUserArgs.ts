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
}
