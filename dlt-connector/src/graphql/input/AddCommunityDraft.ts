// https://www.npmjs.com/package/@apollo/protobufjs
import { InputType, Field } from 'type-graphql'

import { isValidDateString } from '../validator/DateString'
import { IsBoolean, IsUUID } from 'class-validator'

@InputType()
export class AddCommunityDraft {
  @Field(() => String)
  @IsUUID('4')
  communityUuid: string

  @Field(() => String)
  @isValidDateString()
  createdAt: string

  @Field(() => Boolean)
  @IsBoolean()
  foreign: boolean
}
