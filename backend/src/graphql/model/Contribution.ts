import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { Contribution as dbContribution } from '@entity/Contribution'
import { User } from '@entity/User'

@ObjectType()
export class Contribution {
  constructor(contribution: dbContribution, user: User) {
    this.id = contribution.id
    this.firstName = user ? user.firstName : null
    this.lastName = user ? user.lastName : null
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.createdAt = contribution.createdAt
    this.deletedAt = contribution.deletedAt
    this.confirmedAt = contribution.confirmedAt
    this.confirmedBy = contribution.confirmedBy
    this.contributionDate = contribution.contributionDate
    this.state = contribution.contributionStatus
    this.messagesCount = contribution.messages ? contribution.messages.length : 0
  }

  @Field(() => Number)
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
  deletedAt: Date | null

  @Field(() => Date, { nullable: true })
  confirmedAt: Date | null

  @Field(() => Number, { nullable: true })
  confirmedBy: number | null

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
