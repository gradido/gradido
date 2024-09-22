// https://www.npmjs.com/package/@apollo/protobufjs
import { InputTransactionType } from '@enum/InputTransactionType'
import { isValidDateString, isValidNumberString } from '@validator/DateString'
import { IsEnum, IsObject, IsPositive, ValidateNested } from 'class-validator'
import { InputType, Field, Int } from 'type-graphql'

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

  @Field(() => Int)
  @IsPositive()
  backendTransactionId: number

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
