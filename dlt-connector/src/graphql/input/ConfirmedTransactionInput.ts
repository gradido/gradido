// https://www.npmjs.com/package/@apollo/protobufjs

import { IsString } from 'class-validator'
import { InputType, Field } from 'type-graphql'

// from Node Server
@InputType()
export class ConfirmedTransactionInput {
  @Field(() => String)
  @IsString()
  transactionBase64: string

  @Field(() => String)
  @IsString()
  iotaTopic: string
}
