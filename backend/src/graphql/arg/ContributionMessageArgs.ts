import { ArgsType, Field, Int, InputType } from 'type-graphql'

@InputType()
@ArgsType()
export class ContributionMessageArgs {
  @Field(() => Int)
  contributionId: number

  @Field(() => String)
  message: string
}
