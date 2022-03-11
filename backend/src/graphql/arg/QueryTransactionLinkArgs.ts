import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class QueryTransactionLinkArgs {
  @Field(() => String)
  code: string

  @Field(() => Int, { nullable: true })
  redeemUserId?: number
}
