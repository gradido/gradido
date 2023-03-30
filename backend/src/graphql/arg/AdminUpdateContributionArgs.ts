import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class AdminUpdateContributionArgs {
  @Field(() => Int)
  id: number

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string
}
