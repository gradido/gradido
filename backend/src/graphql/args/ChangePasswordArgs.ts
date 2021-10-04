import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class ChangePasswordArgs {
  @Field(() => Number)
  sessionId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  password: string
}
