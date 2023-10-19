import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class AuthenticationArgs {
  @Field(() => String)
  oneTimeCode: string

  @Field(() => String)
  uuid: string
}
