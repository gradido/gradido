import { ContributionMessage as DbContributionMessage } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class ContributionMessage {
  constructor(dbContributionMessage: DbContributionMessage) {
    const user = dbContributionMessage.user
    this.id = dbContributionMessage.id
    this.message = dbContributionMessage.message
    this.createdAt = dbContributionMessage.createdAt
    this.updatedAt = dbContributionMessage.updatedAt
    this.type = dbContributionMessage.type
    this.userFirstName = user?.firstName ?? null
    this.userLastName = user?.lastName ?? null
    this.userAlias = user?.alias ?? null
    this.userId = user?.id ?? null
    this.isModerator = dbContributionMessage.isModerator
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

  // What the wallet's contribution thread shows as the author's name (NU-020): the
  // moderation appears under its alias, and the member's own messages are labelled from
  // the member's own store. Null only for messages whose author row is gone.
  @Field(() => String, { nullable: true })
  userAlias: string | null

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
