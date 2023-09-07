import { IsBoolean, IsPositive, IsString } from 'class-validator'
import { Field, ArgsType, Int } from 'type-graphql'

import { ContributionStatus } from '@enum/ContributionStatus'

import { isContributionStatusArray } from '@/graphql/validator/ContributionStatusArray'

@ArgsType()
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
  noHashtag?: boolean | null
}
