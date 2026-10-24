import {
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
} from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'
import { lastConversationMessage } from '@/data/ContributionConversation.logic'
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
    // Whose word is the last in the conversation with the member, and of which kind: the admin's
    // details button tells the member's answer from the member's change by it.
    const last = dbContribution.messages
      ? lastConversationMessage(dbContribution.messages)
      : undefined
    this.lastMessageType = last ? last.type : null
    this.lastMessageByModerator = last ? last.isModerator : null

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

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => Int, { nullable: true })
  moderatorId: number | null

  @Field(() => String)
  contributionStatus: string

  @Field(() => Int)
  messagesCount: number

  // The newest message of the conversation with the member, the moderators' internal notes left
  // out (ContributionConversation.logic.ts); null where nothing was said, or where the messages
  // were not asked for. Its type as the text the message itself carries (ContributionMessage
  // `type`): a value outside the enum must not take the whole list down with it.
  @Field(() => String, { nullable: true })
  lastMessageType: string | null

  @Field(() => Boolean, { nullable: true })
  lastMessageByModerator: boolean | null

  @Field(() => [ContributionMessage], { nullable: true })
  messages: ContributionMessage[] | null
}
