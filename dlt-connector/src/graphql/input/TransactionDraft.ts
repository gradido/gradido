// https://www.npmjs.com/package/@apollo/protobufjs
import { InputTransactionType } from '@enum/InputTransactionType'
import { isValidDateString, isValidNumberString } from '@validator/DateString'
import { IsEnum, IsObject, ValidateNested } from 'class-validator'
import { InputType, Field } from 'type-graphql'

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
  @Field(() => String, { nullable: true })
  @isValidDateString()
  timeoutDate?: string

  // only for register address
  @Field(() => AccountType, { nullable: true })
  @IsEnum(AccountType)
  accountType?: AccountType
}
