import { Decimal } from 'decimal.js-light'
import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class TransactionSendArgs {
  @Field(() => String)
  identifier: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => Int)
  targetCommunity: number
}
