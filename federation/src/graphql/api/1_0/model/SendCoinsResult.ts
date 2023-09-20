import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class SendCoinsResult {
  constructor() {
    this.vote = false
  }

  @Field(() => Boolean)
  vote: boolean

  @Field(() => String)
  recipGradidoID: string | null

  @Field(() => String)
  recipName: string | null
}
