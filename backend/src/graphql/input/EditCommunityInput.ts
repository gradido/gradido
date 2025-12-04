import { IsString, IsUUID } from 'class-validator'
import { ArgsType, Field, InputType } from 'type-graphql'

import { Location } from '@/graphql/model/Location'
import { isValidHieroId } from '@/graphql/validator/HieroId'
import { isValidLocation } from '@/graphql/validator/Location'

@ArgsType()
@InputType()
export class EditCommunityInput {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => String, { nullable: true })
  @IsString()
  gmsApiKey?: string | null

  @Field(() => Location, { nullable: true })
  @isValidLocation()
  location?: Location | null

  @Field(() => String, { nullable: true })
  @IsString()
  @isValidHieroId()
  hieroTopicId?: string | null
}
