import { IsBoolean, IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class CommunityArgs {
  @Field(() => String, { nullable: true })
  @IsString()
  communityIdentifier?: string | null

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  foreign?: boolean | null
}
