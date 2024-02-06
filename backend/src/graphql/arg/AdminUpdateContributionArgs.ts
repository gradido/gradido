import { IsPositive, MaxLength, MinLength } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, Int } from 'type-graphql'

import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from '@/graphql/resolver/const/const'
import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'

@ArgsType()
export class AdminUpdateContributionArgs {
  @Field(() => Int)
  @IsPositive()
  id: number

  @Field(() => Decimal, { nullable: true })
  @IsPositiveDecimal()
  amount?: Decimal | null

  @Field(() => String, { nullable: true })
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo?: string | null

  @Field(() => String, { nullable: true })
  @isValidDateString()
  creationDate?: string | null

  @Field(() => String, { nullable: true })
  @isValidDateString()
  resubmissionAt?: string | null
}
