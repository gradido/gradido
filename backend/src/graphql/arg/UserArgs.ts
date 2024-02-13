import { IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class UserArgs {
  @Field()
  @IsString()
  identifier: string

  @Field()
  @IsString()
  communityIdentifier: string
}
