import {
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
} from 'database'
import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

import { ContributionMessage } from './ContributionMessage'
import { User } from './User'

@ObjectType()
export class UnconfirmedContribution {
  constructor(dbContribution: DbContribution) {
    const user = dbContribution.user
    this.id = dbContribution.id
    this.userId = dbContribution.userId
    this.amount = dbContribution.amount
    this.memo = dbContribution.memo
    this.contributionDate = dbContribution.contributionDate
    this.user = user ? new User(user) : null
    this.moderatorId = dbContribution.moderatorId
    this.contributionStatus = dbContribution.contributionStatus
    this.messagesCount = dbContribution.messages ? dbContribution.messages.length : 0

    this.messages = dbContribution.messages
      ? dbContribution.messages.map(
          (dbMessage: DbContributionMessage) => new ContributionMessage(dbMessage),
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
