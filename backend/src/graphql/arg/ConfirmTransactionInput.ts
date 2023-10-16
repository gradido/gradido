import { IsInt, IsString } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { InputType, Field, Int } from 'type-graphql'

import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'

@InputType()
export class ConfirmedTransactionInput {
  @Field(() => Int)
  @IsInt()
  transactionId: number

  @Field(() => String)
  @IsString()
  iotaMessageId: string

  @Field(() => String)
  @IsString()
  gradidoId: string

  @Field(() => Decimal)
  @IsPositiveDecimal()
  balance: Decimal

  @Field(() => String)
  @isValidDateString()
  balanceDate: string
}
