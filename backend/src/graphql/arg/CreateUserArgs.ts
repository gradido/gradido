import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class CreateUserArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String, { nullable: true })
  language?: string | null

  @Field(() => Int, { nullable: true })
  publisherId?: number | null

  @Field(() => String, { nullable: true })
  redeemCode?: string | null
}
