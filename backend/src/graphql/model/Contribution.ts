import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { Contribution as dbContribution } from '@entity/Contribution'
import { User as DbUser } from '@entity/User'
import { User } from './User'

@ObjectType()
export class Contribution {
  constructor(contribution: dbContribution, user: DbUser) {
    this.id = contribution.id
    this.user = new User(user)
    this.user.email = '***'
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.createdAt = contribution.createdAt
    this.deletedAt = contribution.deletedAt
    this.confirmedAt = contribution.confirmedAt
    this.confirmedBy = contribution.confirmedBy
    this.contributionDate = contribution.contributionDate
    this.state = contribution.contributionStatus
    this.messagesCount = contribution.messages ? contribution.messages.length : 0
    this.deniedAt = contribution.deniedAt
    this.deniedBy = contribution.deniedBy
  }

  @Field(() => Number)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  memo: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date, { nullable: true })
  confirmedAt: Date | null

  @Field(() => Number, { nullable: true })
  confirmedBy: number | null

  @Field(() => Date, { nullable: true })
  deniedAt: Date | null

  @Field(() => Number, { nullable: true })
  deniedBy: number | null

  @Field(() => Date)
  contributionDate: Date

  @Field(() => Number)
  messagesCount: number

  @Field(() => String)
  state: string
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
