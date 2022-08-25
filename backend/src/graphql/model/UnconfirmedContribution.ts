import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'
import { ContributionMessage } from '@model/ContributionMessage'

@ObjectType()
export class UnconfirmedContribution {
  constructor(contribution: Contribution, user: User | undefined, creations: Decimal[]) {
    this.id = contribution.id
    this.userId = contribution.userId
    this.amount = contribution.amount
    this.memo = contribution.memo
    this.date = contribution.contributionDate
    this.firstName = user ? user.firstName : ''
    this.lastName = user ? user.lastName : ''
    this.email = user ? user.email : ''
    this.creation = creations
    this.state = contribution.contributionStatus
    this.messages = contribution.messages
      ? contribution.messages.map((message) => new ContributionMessage(message, message.user))
      : []
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

  @Field(() => [Decimal])
  creation: Decimal[]

  @Field(() => String)
  state: string

  @Field(() => [ContributionMessage])
  messages: ContributionMessage[]
}
