import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class SendCoinsResult {
  constructor() {
    this.vote = false
  }

  @Field(() => Boolean)
  vote: boolean

  @Field(() => String, { nullable: true })
  recipGradidoID: string | null

  @Field(() => String, { nullable: true })
  recipName: string | null
}
