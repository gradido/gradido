import { IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class OpenConnectionCallbackArgs {
  @Field(() => String)
  @IsString()
  oneTimeCode: string

  @Field(() => String)
  @IsString()
  url: string
}
