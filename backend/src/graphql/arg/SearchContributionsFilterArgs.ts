import { Field, ArgsType, Int } from 'type-graphql'

import { ContributionStatus } from '@enum/ContributionStatus'

@ArgsType()
export class SearchContributionsFilterArgs {
  @Field(() => [ContributionStatus], { nullable: true, defaultValue: null })
  statusFilter?: ContributionStatus[] | null

  @Field(() => Int, { nullable: true })
  userId?: number | null

  @Field(() => String, { nullable: true, defaultValue: '' })
  query?: string | null

  @Field(() => Boolean, { nullable: true })
  noHashtag?: boolean | null
}
