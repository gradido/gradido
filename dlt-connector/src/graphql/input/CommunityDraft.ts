// https://www.npmjs.com/package/@apollo/protobufjs

import { IsBoolean, IsUUID } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import { isValidDateString } from '@validator/DateString'

@InputType()
export class CommunityDraft {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => Boolean)
  @IsBoolean()
  foreign: boolean

  @Field(() => String)
  @isValidDateString()
  createdAt: string
}
