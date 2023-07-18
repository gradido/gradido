// https://www.npmjs.com/package/@apollo/protobufjs

import { Decimal } from 'decimal.js-light'
import { TransactionType } from '../enum/TransactionType'
import { InputType, Field } from 'type-graphql'

@InputType()
export class TransactionInput {
  @Field(() => TransactionType)
  type: TransactionType

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Number)
  createdAt: number

  // @protoField.d(4, 'string')
  // @Field(() => Decimal)
  // communitySum: Decimal
}
