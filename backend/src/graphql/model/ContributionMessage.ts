import { ContributionMessage as DbContributionMessage } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

import { avatarColorIndex } from '@/data/AvatarColor.logic'
import { PublishNameLogic } from '@/data/PublishName.logic'

@ObjectType()
export class ContributionMessage {
  constructor(dbContributionMessage: DbContributionMessage) {
    const user = dbContributionMessage.user
    this.id = dbContributionMessage.id
    this.message = dbContributionMessage.message
    this.createdAt = dbContributionMessage.createdAt
    this.updatedAt = dbContributionMessage.updatedAt
    this.type = dbContributionMessage.type
    this.userAlias = user ? new PublishNameLogic(user).getPublicAlias() : null
    this.userAvatarColorIndex = user ? avatarColorIndex(user.firstName, user.lastName) : null
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

  // What the wallet's contribution thread shows as the author's name (NU-020): the
  // moderation appears under its alias, and the member's own messages are labelled from
  // the member's own store. Without a usable alias the gradidoID stands in, through the
  // one rule that decides this (NU-018) -- an author must not turn nameless.
  // Null only for messages whose author row is gone.
  @Field(() => String, { nullable: true })
  userAlias: string | null

  // The author's circle colour as a finished digit (NU-017), computed from the real
  // initials the way the whole wallet does it -- sent so the real name itself no longer
  // has to travel on this type while no circle changes colour (AS-010).
  @Field(() => Int, { nullable: true })
  userAvatarColorIndex: number | null

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
