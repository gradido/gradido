import { ArgsType, Field } from 'type-graphql'
import Decimal from '../../util/decimal'

@ArgsType()
export default class TransactionSendArgs {
  @Field(() => String)
  email: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string
}
