import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { Contribution as dbContribution } from '@entity/Contribution'
import { User } from './User'

@ObjectType()
export class Contribution {
  constructor(contribution: dbContribution, user: User) {
    this.id = contribution.id
    this.user = user
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.createdAt = contribution.createdAt
    this.deletedAt = contribution.deletedAt
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
}

@ObjectType()
export class ContributionListResult {
  constructor(count: number, list: Contribution[]) {
    this.linkCount = count
    this.linkList = list
  }

  @Field(() => Int)
  linkCount: number

  @Field(() => [Contribution])
  linkList: Contribution[]
}
