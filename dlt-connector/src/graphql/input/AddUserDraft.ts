// https://www.npmjs.com/package/@apollo/protobufjs

import { IsUUID } from 'class-validator'
import { isValidDateString } from '../validator/DateString'
import { InputType, Field } from 'type-graphql'

@InputType()
export class AddUserDraft {
  @Field(() => String)
  @IsUUID('4')
  uuid: string

  @Field(() => String)
  @IsUUID('4')
  communityUuid: string

  @Field(() => String)
  @isValidDateString()
  createdAt: string
}
