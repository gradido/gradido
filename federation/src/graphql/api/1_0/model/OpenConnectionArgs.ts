import { IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class OpenConnectionArgs {
  @Field(() => String)
  @IsString()
  publicKey: string

  @Field(() => String)
  @IsString()
  url: string
}
