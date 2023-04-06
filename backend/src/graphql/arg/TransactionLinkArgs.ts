import { Decimal } from 'decimal.js-light'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class TransactionLinkArgs {
  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string
}
