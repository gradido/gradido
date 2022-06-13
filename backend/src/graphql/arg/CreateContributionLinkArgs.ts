import { ArgsType, Field, Int, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export default class CreateContributionLinkArgs {
  @Field(() => String)
  startDate: string

  @Field(() => String)
  endDate: string

  @Field(() => String)
  name: string

  @Field(() => String)
  amount: string

  @Field(() => String)
  memo: string

  @Field(() => String)
  cycle: string

  @Field(() => String)
  repetition: string

  @Field(() => String)
  maxAmount: string
}
