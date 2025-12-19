import { ContributionStatus } from '@enum/ContributionStatus'
import { Contribution as DbContribution } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { UnconfirmedContribution } from './UnconfirmedContribution'

@ObjectType()
export class Contribution extends UnconfirmedContribution {
  constructor(dbContribution: DbContribution) {
    super(dbContribution)
    this.createdAt = dbContribution.createdAt
    this.moderatorId = dbContribution.moderatorId
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
    if( ContributionStatus.CONFIRMED === dbContribution.contributionStatus) {
      this.closedAt = dbContribution.confirmedAt
      this.closedBy = dbContribution.confirmedBy
    } else if (ContributionStatus.DELETED === dbContribution.contributionStatus) {
      this.closedAt = dbContribution.deletedAt
      this.closedBy = dbContribution.deletedBy
    } else if (ContributionStatus.DENIED === dbContribution.contributionStatus ) {
      this.closedAt = dbContribution.deniedAt
      this.closedBy = dbContribution.deniedBy
    }
  }


  @Field(() => Date, { nullable: true })
  closedAt?: Date | null

  @Field(() => Int, { nullable: true })
  closedBy?: number | null

  @Field(() => String, { nullable: true })
  closedByUserName?: string | null

  @Field(() => Date)
  createdAt: Date

  @Field(() => Int, { nullable: true })
  moderatorId: number | null

  @Field(() => String, { nullable: true })
  moderatorUserName?: string | null

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

  @Field(() => String, { nullable: true })
  updatedByUserName?: string | null

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
