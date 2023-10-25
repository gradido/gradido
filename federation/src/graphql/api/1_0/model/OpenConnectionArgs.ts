import { Field, InputType } from 'type-graphql'

@InputType()
export class OpenConnectionArgs {
  @Field(() => String)
  publicKey: string

  @Field(() => String)
  url: string
}
