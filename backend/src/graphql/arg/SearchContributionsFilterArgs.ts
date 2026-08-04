import { ContributionStatus } from '@enum/ContributionStatus'
import { IsBoolean, IsPositive, IsString } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

import { isContributionStatusArray } from '@/graphql/validator/ContributionStatusArray'

@ArgsType()
@InputType()
export class SearchContributionsFilterArgs {
  @Field(() => [ContributionStatus], { nullable: true, defaultValue: null })
  @isContributionStatusArray()
  statusFilter?: ContributionStatus[] | null

  @Field(() => Int, { nullable: true })
  @IsPositive()
  userId?: number | null

  @Field(() => String, { nullable: true, defaultValue: '' })
  @IsString()
  query?: string | null

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  hideResubmission?: boolean | null

  // Group functions: filter by a single creation group (stored WITHOUT the leading
  // '#'). Separate from `query`, so full-text search and group filter work at the same time.
  @Field(() => String, { nullable: true, defaultValue: null })
  @IsString()
  creationGroup?: string | null
}
