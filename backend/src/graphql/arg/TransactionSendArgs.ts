import { IsString, MaxLength, MinLength } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from '@/graphql/resolver/const/const'
import { IsPositiveGradidoUnit } from '@/graphql/validator/GradidoUnit'
import { GradidoUnit } from 'shared-native'

@ArgsType()
export class TransactionSendArgs {
  @Field(() => String)
  @IsString()
  recipientCommunityIdentifier: string

  @Field(() => String)
  @IsString()
  recipientIdentifier: string

  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  amount: GradidoUnit

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string
}
