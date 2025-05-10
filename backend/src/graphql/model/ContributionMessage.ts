import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class ContributionMessage {
  constructor(contributionMessage: DbContributionMessage) {
    const user = contributionMessage.user
    this.id = contributionMessage.id
    this.message = contributionMessage.message
    this.createdAt = contributionMessage.createdAt
    this.updatedAt = contributionMessage.updatedAt
    this.type = contributionMessage.type
    this.userFirstName = user?.firstName ?? null
    this.userLastName = user?.lastName ?? null
    this.userId = user?.id ?? null
    this.isModerator = contributionMessage.isModerator
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  message: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  @Field(() => String)
  type: string

  @Field(() => String, { nullable: true })
  userFirstName: string | null

  @Field(() => String, { nullable: true })
  userLastName: string | null

  @Field(() => Int, { nullable: true })
  userId: number | null

  @Field(() => Boolean)
  isModerator: boolean
}
@ObjectType()
export class ContributionMessageListResult {
  @Field(() => Int)
  count: number

  @Field(() => [ContributionMessage])
  messages: ContributionMessage[]
}
