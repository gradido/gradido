import { IsEmail, IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class UnsecureLoginArgs {
  @Field(() => String)
  @IsEmail()
  email: string

  @Field(() => String)
  @IsString()
  password: string

  @Field(() => String, { nullable: true })
  @IsString()
  project?: string | null
}
