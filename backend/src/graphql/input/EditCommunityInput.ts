import { IsString, IsUUID } from 'class-validator'
import { ArgsType, Field, InputType } from 'type-graphql'

import { Point } from '@/graphql/model/Point'
import { isValidPoint } from '@/graphql/validator/Point'

@ArgsType()
@InputType()
export class EditCommunityInput {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => String)
  @IsString()
  gmsApiKey: string

  @Field(() => Point)
  @isValidPoint()
  location: Point
}
