import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class OpenConnectionArgs {
  @Field(() => String)
  publicKey: string

  @Field(() => String)
  url: string
}
