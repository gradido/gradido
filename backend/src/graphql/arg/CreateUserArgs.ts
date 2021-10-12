import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class CreateUserArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  password: string

  @Field(() => String)
  language: string
}
