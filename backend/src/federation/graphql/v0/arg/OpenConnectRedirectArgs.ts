import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class OpenConnectRedirectArgs {
  @Field(() => String)
  oneTimeCode: string

  @Field(() => String)
  url: string

  @Field(() => String)
  encryptedRedirectUrl: string
}
