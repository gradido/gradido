// https://www.npmjs.com/package/@apollo/protobufjs

import { Decimal } from 'decimal.js-light'
import { TransactionType } from '../enum/TransactionType'
import { InputType, Field } from 'type-graphql'
import { IsEnum, IsInt, Min } from 'class-validator'
import { IsPositiveDecimal } from '../validator/Decimal'

@InputType()
export class TransactionInput {
  @Field(() => TransactionType)
  @IsEnum(TransactionType)
  type: TransactionType

  @Field(() => Decimal)
  @IsPositiveDecimal()
  amount: Decimal

  @Field(() => Number)
  @IsInt()
  @Min(978346800)
  createdAt: number

  // @protoField.d(4, 'string')
  // @Field(() => Decimal)
  // communitySum: Decimal
}
