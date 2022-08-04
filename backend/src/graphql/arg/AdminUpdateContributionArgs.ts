import { ArgsType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ArgsType()
export default class AdminUpdateContributionArgs {
  @Field(() => Int)
  id: number

  @Field(() => String)
  email: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string
}
