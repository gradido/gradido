import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'
import { ContributionMonth } from './ContributionMonth'

@ObjectType()
export class UnconfirmedContribution {
  constructor(contribution: Contribution, user: User | undefined, creations: ContributionMonth[]) {
    this.id = contribution.id
    this.userId = contribution.userId
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.date = contribution.contributionDate
    this.firstName = user ? user.firstName : ''
    this.lastName = user ? user.lastName : ''
    this.email = user ? user.emailContact.email : ''
    this.moderator = contribution.moderatorId
    this.creation = creations
    this.state = contribution.contributionStatus
    this.messageCount = contribution.messages ? contribution.messages.length : 0
  }

  @Field(() => String)
  firstName: string

  @Field(() => Int)
  id?: number

  @Field(() => String)
  lastName: string

  @Field(() => Number)
  userId: number

  @Field(() => String)
  email: string

  @Field(() => Date)
  date: Date

  @Field(() => String)
  memo: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Number, { nullable: true })
  moderator: number | null

  @Field(() => [ContributionMonth])
  creation: ContributionMonth[]

  @Field(() => String)
  state: string

  @Field(() => Number)
  messageCount: number
}
