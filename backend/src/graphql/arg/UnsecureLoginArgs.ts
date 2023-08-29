import { IsEmail, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class UnsecureLoginArgs {
  @Field(() => String)
  @IsEmail()
  email: string

  @Field(() => String)
  @IsString()
  password: string

  @Field(() => Int, { nullable: true })
  @IsInt()
  publisherId?: number | null
}
