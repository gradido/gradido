import { Contribution as DbContribution } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

import { UnconfirmedContribution } from './UnconfirmedContribution'

@ObjectType()
export class Contribution extends UnconfirmedContribution {
  constructor(dbContribution: DbContribution) {
    super(dbContribution)
    this.createdAt = dbContribution.createdAt
    this.confirmedAt = dbContribution.confirmedAt
    this.confirmedBy = dbContribution.confirmedBy
    this.contributionDate = dbContribution.contributionDate

    this.deniedAt = dbContribution.deniedAt
    this.deniedBy = dbContribution.deniedBy
    this.deletedAt = dbContribution.deletedAt
    this.deletedBy = dbContribution.deletedBy
    this.updatedAt = dbContribution.updatedAt
    this.updatedBy = dbContribution.updatedBy
    this.resubmissionAt = dbContribution.resubmissionAt
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
  constructor(count: number, list: DbContribution[]) {
    this.contributionCount = count
    this.contributionList = list.map(
      (dbContribution: DbContribution) => new Contribution(dbContribution),
    )
  }

  @Field(() => Int)
  contributionCount: number

  @Field(() => [Contribution])
  contributionList: Contribution[]
}
