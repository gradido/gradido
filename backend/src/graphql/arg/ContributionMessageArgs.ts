import { ArgsType, Field, Int, InputType } from 'type-graphql'

import { ContributionMessageType } from '@enum/ContributionMessageType'

@InputType()
@ArgsType()
export class ContributionMessageArgs {
  @Field(() => Int)
  contributionId: number

  @Field(() => String)
  message: string

  @Field(() => ContributionMessageType, { defaultValue: ContributionMessageType.DIALOG })
  messageType: ContributionMessageType
}
