import { Contribution } from '@entity/Contribution'
import { ContributionMessage as dbContributionMessage } from '@entity/ContributionMessage'

import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

import { ContributionMessage } from './ContributionMessage'
import { User } from './User'

@ObjectType()
export class UnconfirmedContribution {
  constructor(contribution: Contribution) {
    const user = contribution.user
    this.id = contribution.id
    this.userId = contribution.userId
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.contributionDate = contribution.contributionDate
    this.user = user ? new User(user) : null
    this.moderatorId = contribution.moderatorId
    this.contributionStatus = contribution.contributionStatus
    this.messagesCount = contribution.messages ? contribution.messages.length : 0

    this.messages = contribution.messages
      ? contribution.messages.map(
          (message: dbContributionMessage) => new ContributionMessage(message),
        )
      : null
  }

  @Field(() => Int)
  id: number

  @Field(() => Int, { nullable: true })
  userId: number | null

  @Field(() => User, { nullable: true })
  user: User | null

  @Field(() => Date)
  contributionDate: Date

  @Field(() => String)
  memo: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Int, { nullable: true })
  moderatorId: number | null

  @Field(() => String)
  contributionStatus: string

  @Field(() => Int)
  messagesCount: number

  @Field(() => [ContributionMessage], { nullable: true })
  messages: ContributionMessage[] | null
}
