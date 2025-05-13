import { IsPositive, IsString, MaxLength, MinLength } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, Int } from 'type-graphql'

import {
  CONTRIBUTIONLINK_NAME_MAX_CHARS,
  CONTRIBUTIONLINK_NAME_MIN_CHARS,
  MEMO_MAX_CHARS,
  MEMO_MIN_CHARS,
} from '@/graphql/resolver/const/const'
import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'

@ArgsType()
export class ContributionLinkArgs {
  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

  @Field(() => String)
  @MaxLength(CONTRIBUTIONLINK_NAME_MAX_CHARS)
  @MinLength(CONTRIBUTIONLINK_NAME_MIN_CHARS)
  name: string

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string

  @Field(() => String)
  @IsString()
  cycle: string

  @Field(() => String, { nullable: true })
  @isValidDateString()
  validFrom?: string | null

  @Field(() => String, { nullable: true })
  @isValidDateString()
  validTo?: string | null

  @Field(() => Decimal, { nullable: true })
  @IsPositiveDecimal()
  maxAmountPerMonth?: Decimal | null

  @Field(() => Int)
  @IsPositive()
  maxPerCycle: number
}
