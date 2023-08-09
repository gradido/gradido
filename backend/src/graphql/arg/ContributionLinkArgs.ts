import { MaxLength, MinLength } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, Int } from 'type-graphql'

import {
  MEMO_MAX_CHARS,
  MEMO_MIN_CHARS,
  CONTRIBUTIONLINK_NAME_MIN_CHARS,
  CONTRIBUTIONLINK_NAME_MAX_CHARS,
} from '@/graphql/resolver/const/const'

@ArgsType()
export class ContributionLinkArgs {
  @Field(() => Decimal)
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
  cycle: string

  @Field(() => String, { nullable: true })
  validFrom?: string | null

  @Field(() => String, { nullable: true })
  validTo?: string | null

  @Field(() => Decimal, { nullable: true })
  maxAmountPerMonth?: Decimal | null

  @Field(() => Int)
  maxPerCycle: number
}
