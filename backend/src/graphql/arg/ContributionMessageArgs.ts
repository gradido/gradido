import { ArgsType, Field, ID, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export default class ContributionMessageArgs {
  @Field(() => ID)
  contributionId: number

  @Field(() => String)
  message: string
}
