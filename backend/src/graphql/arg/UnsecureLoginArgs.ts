import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class UnsecureLoginArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string

  @Field(() => Int, { nullable: true })
  publisherId?: number | null
}
