import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class CreatePendingCreationArgs {
  @Field(() => String)
  email: string

  @Field(() => Number)
  amount: number

  @Field(() => String)
  note: string

  @Field(() => Date)
  creationDate: Date

  @Field(() => Number)
  moderator: number
}
