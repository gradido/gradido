import { ArgsType, Field, InputType } from 'type-graphql'
import Decimal from 'decimal.js-light'

@InputType()
@ArgsType()
export default class ContributionArgs {
  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string
}
