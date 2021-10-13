import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class UnsecureLoginArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string

  @Field(() => Number, { nullable: true })
  publisherId: number
}
