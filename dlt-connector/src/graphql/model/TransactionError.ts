import { ObjectType, Field } from 'type-graphql'
import { TransactionErrorType } from '../enum/TransactionErrorType'

@ObjectType()
export class TransactionError implements Error {
  constructor(type: TransactionErrorType, message: string) {
    this.type = type
    this.message = message
    this.name = type.toString()
  }

  @Field(() => TransactionErrorType)
  type: TransactionErrorType

  @Field(() => String)
  message: string

  @Field(() => String)
  name: string
}
