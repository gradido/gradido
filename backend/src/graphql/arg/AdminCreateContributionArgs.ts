import { ArgsType, Field, InputType } from 'type-graphql'
import Decimal from 'decimal.js-light'

@InputType()
@ArgsType()
export default class AdminCreateContributionArgs {
  @Field(() => String)
  email: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string
}
