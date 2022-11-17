import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class OpenConnectArgs {
  @Field(() => String)
  pubKey: string

  @Field(() => String)
  encryptedUrl: string
}
