// https://www.npmjs.com/package/@apollo/protobufjs

import { IsString } from 'class-validator'
import { InputType, Field } from 'type-graphql'

@InputType()
export class InvalidTransactionInput {
  @Field(() => String)
  @IsString()
  iotaMessageId: string

  @Field(() => String)
  @IsString()
  errorMessage: string
}
