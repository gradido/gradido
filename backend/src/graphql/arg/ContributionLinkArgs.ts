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

  @Field(() => Date, { nullable: true })
  validFrom?: Date | null

  @Field(() => Date, { nullable: true })
  validTo?: Date | null

  @Field(() => Decimal, { nullable: true })
  maxAmountPerMonth: Decimal | null

  @Field(() => Int, { default: 1 })
  maxPerCycle: number
}
