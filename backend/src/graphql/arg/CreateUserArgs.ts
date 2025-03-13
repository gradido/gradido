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
}
