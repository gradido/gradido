import { IsInt, IsString } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { InputType, Field, Int } from 'type-graphql'

import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'

@InputType()
export class ConfirmedTransactionInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  transactionId?: number | null

  @Field(() => String)
  @IsString()
  iotaMessageId: string

  @Field(() => String, { nullable: true })
  @IsString()
  gradidoId?: string | null

  @Field(() => Decimal)
  @IsPositiveDecimal()
  balance: Decimal

  @Field(() => String)
  @isValidDateString()
  balanceDate: string
}
