import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class SendCoinsResult {
  constructor() {
    this.vote = false
  }

  @Field(() => Boolean)
  vote: boolean

  @Field(() => String)
  receiverFirstName: string

  @Field(() => String)
  receiverLastName: string
}
