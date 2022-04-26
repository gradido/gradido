import { ArgsType, Field, InputType, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@InputType()
@ArgsType()
export default class CreatePendingCreationArgs {
  @Field(() => String)
  email: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string

  @Field(() => Int)
  moderator: number
}
