import { ArgsType, Field, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export default class ContributionMessageArgs {
  @Field(() => Number)
  contributionId: number

  @Field(() => String)
  message: string
}
