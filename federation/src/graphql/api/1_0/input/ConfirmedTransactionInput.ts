
import { Field, InputType } from 'type-graphql'
@InputType()
export class ConfirmedTransactionInput {
  @Field(() => String)
  transactionBase64: string

  @Field(() => String)
  communityUuid: string
}
