// https://www.npmjs.com/package/@apollo/protobufjs

import { Decimal } from 'decimal.js-light'
import { TransactionType } from '@enum/TransactionType'
import { InputType, Field } from 'type-graphql'
import { User } from '@arg/User'
import { isValidDateString } from '../validator/DateString'
import { IsPositiveDecimal } from '../validator/Decimal'
import { IsEnum, IsObject, ValidateNested, IsNumber, Min } from 'class-validator'

@InputType()
export class TransactionDraft {
  @Field(() => User)
  @IsObject()
  @ValidateNested()
  senderUser: User

  @Field(() => User)
  @IsObject()
  @ValidateNested()
  recipientUser: User

  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

  @Field(() => TransactionType)
  @IsEnum(TransactionType)
  type: TransactionType

  @Field(() => Number)
  @IsNumber()
  @Min(9783072000000) // 01.01.2001
  createdAt: number // in milliseconds

  // only for creation transactions
  @Field(() => String, { nullable: true })
  @isValidDateString()
  targetDate?: string
}
