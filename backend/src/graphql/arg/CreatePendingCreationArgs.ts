import { ArgsType, Field, InputType, Int } from 'type-graphql'

@InputType()
@ArgsType()
export default class CreatePendingCreationArgs {
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
