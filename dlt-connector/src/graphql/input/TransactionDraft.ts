// https://www.npmjs.com/package/@apollo/protobufjs
import { IsEnum, IsObject, ValidateNested } from 'class-validator'
import { InputType, Field } from 'type-graphql'

import { InputTransactionType } from '@enum/InputTransactionType'
import { isValidDateString, isValidNumberString } from '@validator/DateString'

import { UserIdentifier } from './UserIdentifier'

@InputType()
export class TransactionDraft {
  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  user: UserIdentifier

  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  linkedUser: UserIdentifier

  @Field(() => String)
  @isValidNumberString()
  amount: string

  @Field(() => InputTransactionType)
  @IsEnum(InputTransactionType)
  type: InputTransactionType

  @Field(() => String)
  @isValidDateString()
  createdAt: string

  // only for creation transactions
  @Field(() => String, { nullable: true })
  @isValidDateString()
  targetDate?: string
}
