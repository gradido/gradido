import { Contribution as dbContribution } from '@entity/Contribution'
import { User } from '@entity/User'
import { Decimal } from 'decimal.js-light'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class Contribution {
  constructor(contribution: dbContribution, user?: User | null) {
    this.id = contribution.id
    this.firstName = user ? user.firstName : null
    this.lastName = user ? user.lastName : null
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.createdAt = contribution.createdAt
    this.confirmedAt = contribution.confirmedAt
    this.confirmedBy = contribution.confirmedBy
    this.contributionDate = contribution.contributionDate
    this.state = contribution.contributionStatus
    this.messagesCount = contribution.messages ? contribution.messages.length : 0
    this.deniedAt = contribution.deniedAt
    this.deniedBy = contribution.deniedBy
    this.deletedAt = contribution.deletedAt
    this.deletedBy = contribution.deletedBy
    this.moderatorId = contribution.moderatorId
    this.userId = contribution.userId
  }

  @Field(() => Int)
  id: number

  @Field(() => String, { nullable: true })
  firstName: string | null

  @Field(() => String, { nullable: true })
  lastName: string | null

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

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

  @Field(() => Date)
  contributionDate: Date

  @Field(() => Int)
  messagesCount: number

  @Field(() => String)
  state: string

  @Field(() => Int, { nullable: true })
  moderatorId: number | null

  @Field(() => Int, { nullable: true })
  userId: number | null
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
