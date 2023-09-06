// https://www.npmjs.com/package/@apollo/protobufjs

import { Decimal } from 'decimal.js-light'
import { TransactionType } from '@enum/TransactionType'
import { InputType, Field } from 'type-graphql'
import { UserIdentifier } from './UserIdentifier'
import { isValidDateString } from '@validator/DateString'
import { IsPositiveDecimal } from '@validator/Decimal'
import { IsEnum, IsObject, ValidateNested } from 'class-validator'

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

  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

  @Field(() => TransactionType)
  @IsEnum(TransactionType)
  type: TransactionType

  @Field(() => String)
  @isValidDateString()
  createdAt: string // in milliseconds

  // only for creation transactions
  @Field(() => String, { nullable: true })
  @isValidDateString()
  targetDate?: string
}
