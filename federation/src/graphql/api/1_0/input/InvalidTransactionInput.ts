
import { Field, InputType } from 'type-graphql'
@InputType()
export class InvalidTransactionInput {
  @Field(() => String)
  errorMessage: string

  @Field(() => String)
  hieroTransactionId: string
}
