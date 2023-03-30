import { ArgsType, Field } from 'type-graphql'
import { Decimal } from 'decimal.js-light'

@ArgsType()
export default class TransactionLinkArgs {
  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string
}
