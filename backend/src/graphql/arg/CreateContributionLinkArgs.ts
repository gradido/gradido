import { ArgsType, Field, Int, InputType } from 'type-graphql'
import Decimal from 'decimal.js-light'

@InputType()
@ArgsType()
export default class CreateContributionLinkArgs {
  @Field(() => String)
  startDate: string

  @Field(() => String)
  endDate: string

  @Field(() => String)
  name: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  cycle: string

  @Field(() => Int)
  repetition: number

  @Field(() => Decimal)
  maxAmount: Decimal
}
