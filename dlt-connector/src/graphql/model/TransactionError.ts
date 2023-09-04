import { ObjectType, Field } from 'type-graphql'
import { TransactionErrorType } from '../enum/TransactionErrorType'

@ObjectType()
export class TransactionError {
  constructor(type: TransactionErrorType, message: string) {
    this.type = type
    this.message = message
  }

  @Field(() => TransactionErrorType)
  type: TransactionErrorType

  @Field(() => String)
  message: string
}
