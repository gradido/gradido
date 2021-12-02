import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class CreatePendingCreationArgs {
  @Field(() => Int)
  id: number

  @Field(() => String)
  email: string

  @Field(() => Int)
  amount: number

  @Field(() => String)
  memo: string

  @Field(() => String)
  creationDate: string

  @Field(() => Int)
  moderator: number
}
