// https://www.npmjs.com/package/@apollo/protobufjs
import { isValidDateString } from '@validator/DateString'
import { IsEnum, IsObject, ValidateNested } from 'class-validator'
import { InputType, Field } from 'type-graphql'

import { AccountType } from '@/graphql/enum/AccountType'

import { UserIdentifier } from './UserIdentifier'

@InputType()
export class UserAccountDraft {
  @Field(() => UserIdentifier)
  @IsObject()
  @ValidateNested()
  user: UserIdentifier

  @Field(() => String)
  @isValidDateString()
  createdAt: string

  @Field(() => AccountType)
  @IsEnum(AccountType)
  accountType: AccountType
}
