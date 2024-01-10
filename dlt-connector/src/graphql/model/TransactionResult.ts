import { ObjectType, Field } from 'type-graphql'

import { ConfirmBackendTransaction } from './ConfirmBackendTransaction'
import { TransactionError } from './TransactionError'
import { TransactionRecipe } from './TransactionRecipe'

@ObjectType()
export class TransactionResult {
  constructor(content?: TransactionError | TransactionRecipe | ConfirmBackendTransaction) {
    this.succeed = true
    if (content instanceof TransactionError) {
      this.error = content
      this.succeed = false
    } else if (content instanceof TransactionRecipe) {
      this.recipe = content
    } else if (content instanceof ConfirmBackendTransaction) {
      this.confirmed = content
    }
  }

  // the error if one happened
  @Field(() => TransactionError, { nullable: true })
  error?: TransactionError

  // if no error happend, the message id of the iota transaction
  @Field(() => TransactionRecipe, { nullable: true })
  recipe?: TransactionRecipe

  @Field(() => ConfirmBackendTransaction, { nullable: true })
  confirmed?: ConfirmBackendTransaction

  @Field(() => Boolean)
  succeed: boolean
}
