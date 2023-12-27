import { IsString } from 'class-validator'
import { Field, ArgsType, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export class CommunityArgs {
  @Field(() => String)
  @IsString()
  uuid: string

  @Field(() => String)
  @IsString()
  gmsApiKey: string
}
