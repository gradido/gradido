import { ArgsType, Field, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export default class CreateContributionLinkArgs {
  @Field(() => String)
  validFrom: string

  @Field(() => String, { nullable: true })
  validTo: string | null

  @Field(() => String)
  name: string

  @Field(() => String)
  amount: string

  @Field(() => String)
  memo: string

  @Field(() => String)
  cycle: string

  @Field(() => String, { nullable: true })
  maxPerCycle: string | null

  @Field(() => String, { nullable: true })
  maxAmountPerMonth: string | null
}
