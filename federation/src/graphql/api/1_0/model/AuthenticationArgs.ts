import { IsString, IsUUID } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class AuthenticationArgs {
  @Field(() => String)
  @IsString()
  oneTimeCode: string

  @Field(() => String)
  @IsUUID('4')
  uuid: string
}
