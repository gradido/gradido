import { Decimal } from 'decimal.js-light'
import { TransactionType } from '../graphql/enum/TransactionType'
import { Field, Message } from '@apollo/protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TransactionBody extends Message<TransactionBody> {
  @Field.d(1, TransactionType)
  type: TransactionType

  @Field.d(2, 'string')
  amount: string

  @Field.d(3, 'uint64')
  createdAt: number

  // @protoField.d(4, 'string')
  // communitySum: Decimal
}
