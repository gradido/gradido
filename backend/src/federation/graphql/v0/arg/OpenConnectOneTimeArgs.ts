import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class OpenConnectOneTimeArgs {
  @Field(() => String)
  oneTimeCode: string

  @Field(() => String)
  encryptedUuid: string
}
