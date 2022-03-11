import { ArgsType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ArgsType()
export default class TransactionSendArgs {
  @Field(() => String)
  email: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => Int, { nullable: true })
  senderId?: number
}
