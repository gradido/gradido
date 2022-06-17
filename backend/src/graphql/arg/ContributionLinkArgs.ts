import { ArgsType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ArgsType()
export default class ContributionLinkArgs {
  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  name: string

  @Field(() => String)
  memo: string

  @Field(() => String)
  cycle: string

  @Field(() => String, { nullable: true })
  validFrom?: string | null

  @Field(() => String, { nullable: true })
  validTo?: string | null

  @Field(() => Decimal, { nullable: true })
  maxAmountPerMonth: Decimal | null

  @Field(() => Int)
  maxPerCycle: number
}
