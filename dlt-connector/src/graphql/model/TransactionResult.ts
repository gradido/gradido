import { ObjectType, Field } from 'type-graphql'
import { TransactionError } from './TransactionError'
import { TransactionRecipe } from './TransactionRecipe'

@ObjectType()
export class TransactionResult {
  constructor(content?: TransactionError | TransactionRecipe) {
    this.succeed = true
    if (content instanceof TransactionError) {
      this.error = content
      this.succeed = false
    } else if (content instanceof TransactionRecipe) {
      this.recipe = content
    }
  }

  // the error if one happened
  @Field(() => TransactionError, { nullable: true })
  error?: TransactionError

  // if no error happend, the message id of the iota transaction
  @Field(() => TransactionRecipe, { nullable: true })
  recipe?: TransactionRecipe

  @Field(() => Boolean)
  succeed: boolean
}
