import { ArgsType, Field, Float, Int } from 'type-graphql'

@ArgsType()
export default class CreatePendingCreationArgs {
  @Field(() => Int)
  id: number

  @Field(() => String)
  email: string

  @Field(() => Float)
  amount: number

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string

  @Field(() => Int)
  moderator: number
}
