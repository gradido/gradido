// https://www.npmjs.com/package/@apollo/protobufjs

import { InputType, Field } from 'type-graphql'
import { IsString } from 'class-validator'

@InputType()
export class InvalidTransactionInput {
  @Field(() => String)
  @IsString()
  iotaMessageId: string

  @Field(() => String)
  @IsString()
  errorMessage: string
}
