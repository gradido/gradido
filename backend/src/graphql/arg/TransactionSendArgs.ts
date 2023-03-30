import { Decimal } from 'decimal.js-light'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class TransactionSendArgs {
  @Field(() => String)
  identifier: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string
}
