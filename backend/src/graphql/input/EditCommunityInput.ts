import { IsString, IsUUID } from 'class-validator'
import { ArgsType, Field, InputType } from 'type-graphql'

@ArgsType()
@InputType()
export class EditCommunityInput {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => String)
  @IsString()
  gmsApiKey: string
}
