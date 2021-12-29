import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class CheckUsernameArgs {
  @Field(() => String)
  username: string
}
