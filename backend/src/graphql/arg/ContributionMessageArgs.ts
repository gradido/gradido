import { ArgsType, Field, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export default class ContributionArgs {
  @Field(() => Number)
  contributionId: number

  @Field(() => String)
  message: string
}
