import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class OpenConnectionCallbackArgs {
  @Field(() => String)
  oneTimeCode: string

  @Field(() => String)
  publicKey: string

  @Field(() => String)
  url: string
}
