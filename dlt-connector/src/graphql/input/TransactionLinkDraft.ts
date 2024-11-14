// https://www.npmjs.com/package/@apollo/protobufjs
import { isValidDateString, isValidNumberString } from '@validator/DateString'
import { IsObject, IsString, ValidateNested } from 'class-validator'
import { InputType, Field } from 'type-graphql'

import { UserIdentifier } from './UserIdentifier'

@InputType()
export class TransactionLinkDraft {
  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  user: UserIdentifier

  @Field(() => String)
  @IsString()
  seed: string

  @Field(() => String)
  @isValidNumberString()
  amount: string

  @Field(() => String)
  @isValidDateString()
  createdAt: string

  @Field(() => String)
  @isValidDateString()
  timeoutDate: string
}
