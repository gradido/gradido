// https://www.npmjs.com/package/@apollo/protobufjs
import { InputTransactionType } from '@enum/InputTransactionType'
import { isValidDateString, isValidNumberString } from '@validator/DateString'
import { IsEnum, IsObject, IsPositive, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { InputType, Field } from 'type-graphql'

import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from '@/graphql//const'
import { AccountType } from '@/graphql/enum/AccountType'

import { UserIdentifier } from './UserIdentifier'

@InputType()
export class TransactionDraft {
  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  user: UserIdentifier

  // not used for simply register address
  @Field(() => UserIdentifier, { nullable: true })
  @IsObject()
  @ValidateNested()
  linkedUser?: UserIdentifier

  // not used for register address
  @Field(() => String, { nullable: true })
  @isValidNumberString()
  amount?: string

  @Field(() => String, { nullable: true })
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo?: string

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

  // only for deferred transaction
  // duration in seconds
  @Field(() => Number, { nullable: true })
  @IsPositive()
  timeoutDuration?: number

  // only for register address
  @Field(() => AccountType, { nullable: true })
  @IsEnum(AccountType)
  accountType?: AccountType
}
