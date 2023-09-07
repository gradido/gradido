import { MaxLength, MinLength } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { ArgsType, Field } from 'type-graphql'

import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from '@/graphql/resolver/const/const'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'

@ArgsType()
export class TransactionLinkArgs {
  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string
}
