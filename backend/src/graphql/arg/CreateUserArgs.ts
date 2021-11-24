import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class CreateUserArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  language?: string // Will default to DEFAULT_LANGUAGE

  @Field(() => Int, { nullable: true })
  publisherId: number
}
