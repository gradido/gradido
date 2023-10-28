// https://www.npmjs.com/package/@apollo/protobufjs

import { Decimal } from 'decimal.js-light'
import { InputTransactionType } from '@enum/InputTransactionType'
import { InputType, Field, Int } from 'type-graphql'
import { UserIdentifier } from './UserIdentifier'
import { isValidDateString } from '@validator/DateString'
import { IsPositiveDecimal } from '@validator/Decimal'
import { IsEnum, IsObject, IsPositive, ValidateNested } from 'class-validator'

@InputType()
export class TransactionDraft {
  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  senderUser: UserIdentifier

  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  recipientUser: UserIdentifier

  @Field(() => Int)
  @IsPositive()
  backendTransactionId: number

  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

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
