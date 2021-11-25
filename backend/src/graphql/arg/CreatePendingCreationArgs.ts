import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class CreatePendingCreationArgs {
  @Field(() => String)
  email: string

  @Field(() => Int)
  amount: number

  @Field(() => String)
  note: string

  @Field(() => String)
  creationDate: string

  @Field(() => Int)
  moderator: number
}
