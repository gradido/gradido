// https://www.npmjs.com/package/@apollo/protobufjs
import { Min } from 'class-validator'
import { IsPositiveDecimal } from '../validator/Decimal'
import { Decimal } from 'decimal.js-light'
import { TransactionType } from '../enum/TransactionType'
import { InputType, Field } from 'type-graphql'

@InputType()
export class TransactionInput {
  @Field(() => TransactionType)
  type: TransactionType

  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

  // 946684800 is Sat Jan 01 2000 00:00:00 GMT+0000
  @Field(() => Number)
  @Min(946684800)
  createdAt: number

  // @protoField.d(4, 'string')
  // @Field(() => Decimal)
  // communitySum: Decimal
}
