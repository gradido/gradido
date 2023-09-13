import { ObjectType, Field } from 'type-graphql'
import { TransactionError } from './TransactionError'

@ObjectType()
export class TransactionResult {
  constructor(content?: TransactionError) {
    this.succeed = true
    if (content instanceof TransactionError) {
      this.error = content
      this.succeed = false
    }
  }

  // the error if one happened
  @Field(() => TransactionError, { nullable: true })
  error?: TransactionError

  @Field(() => Boolean)
  succeed: boolean
}
