import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class OpenConnectionArgs {
  @Field(() => String)
  remotePubKey: string

  @Field(() => String)
  encryptedSignedRemoteUrl: string
}
