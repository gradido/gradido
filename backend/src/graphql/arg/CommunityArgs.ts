import { IsBoolean, IsUUID } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class CommunityArgs {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  foreign?: boolean | null

  @Field(() => String, { nullable: true })
  @IsUUID('4')
  communityUuid?: string | null
}
