import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class CreateUserArgs {
  @Field(() => String, { nullable: true })
  alias?: string | null
  
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
