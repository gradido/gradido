// https://www.npmjs.com/package/@apollo/protobufjs

import { InputType, Field } from 'type-graphql'
import { UserIdentifier } from './UserIdentifier'
import { isValidDateString } from '@validator/DateString'
import { IsEnum, IsObject, ValidateNested } from 'class-validator'
import { AccountType } from '@enum/AccountType'

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
