import { IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class OpenConnectionArgs {
  @Field(() => String)
  @IsString()
  publicKey: string

  @Field(() => String)
  @IsString()
  url: string
}
