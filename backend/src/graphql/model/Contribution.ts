import { Contribution as dbContribution } from '@entity/Contribution'

import { Field, Int, ObjectType } from 'type-graphql'

import { UnconfirmedContribution } from './UnconfirmedContribution'

@ObjectType()
export class Contribution extends UnconfirmedContribution {
  constructor(contribution: dbContribution) {
    super(contribution)
    this.createdAt = contribution.createdAt
    this.confirmedAt = contribution.confirmedAt
    this.confirmedBy = contribution.confirmedBy
    this.contributionDate = contribution.contributionDate
    
    this.deniedAt = contribution.deniedAt
    this.deniedBy = contribution.deniedBy
    this.deletedAt = contribution.deletedAt
    this.deletedBy = contribution.deletedBy
    this.updatedAt = contribution.updatedAt
    this.updatedBy = contribution.updatedBy
    this.resubmissionAt = contribution.resubmissionAt
  }

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  confirmedAt: Date | null

  @Field(() => Int, { nullable: true })
  confirmedBy: number | null

  @Field(() => Date, { nullable: true })
  deniedAt: Date | null

  @Field(() => Int, { nullable: true })
  deniedBy: number | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Int, { nullable: true })
  deletedBy: number | null

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  @Field(() => Int, { nullable: true })
  updatedBy: number | null

  @Field(() => Date)
  contributionDate: Date 

  @Field(() => Date, { nullable: true })
  resubmissionAt: Date | null
}

@ObjectType()
export class ContributionListResult {
  constructor(count: number, list: Contribution[]) {
    this.contributionCount = count
    this.contributionList = list
  }

  @Field(() => Int)
  contributionCount: number

  @Field(() => [Contribution])
  contributionList: Contribution[]
}
