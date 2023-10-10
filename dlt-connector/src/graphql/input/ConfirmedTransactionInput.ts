// https://www.npmjs.com/package/@apollo/protobufjs

import { InputType, Field } from 'type-graphql'
import { IsString } from 'class-validator'

@InputType()
export class ConfirmedTransactionInput {
  @Field(() => String)
  @IsString()
  transactionBase64: string

  @Field(() => String)
  @IsString()
  iotaTopic: string
}
