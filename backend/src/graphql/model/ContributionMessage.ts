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
    // The pair that names a member everywhere else in the wallet, so the thread can ask for
    // the author's picture the way every list of people does (see useMemberAvatars).
    this.userGradidoID = user?.gradidoID ?? null
    this.userCommunityUuid = user?.communityUuid ?? null
    // Not on the user row -- it lives in the avatar table. Whoever builds a list of messages
    // fills it in ONE batch (attachMessageAvatarDates), exactly as User.avatarUpdatedAt is
    // filled; null until then, and null for good where there is nothing to show.
    this.userAvatarUpdatedAt = null
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

  // The author as the rest of the wallet names a member: the uuid pair. It is what the
  // picture store keys by and what the memberAvatars query asks about, so a thread can show
  // the faces the booking list and the contact list already show -- the moderation with a
  // face, and the member with their own (ES-028).
  //
  // ⚠️ Not a second name for `userId`: that one is this community's internal row number and
  // means nothing outside it. Null only for messages whose author row is gone.
  @Field(() => String, { nullable: true })
  userGradidoID: string | null

  @Field(() => String, { nullable: true })
  userCommunityUuid: string | null

  // When this author last changed the picture other members may see -- a date, not the
  // picture, exactly as on User.avatarUpdatedAt. The wallet keeps a picture it already holds
  // while the date matches, so a thread usually asks for nothing at all.
  //
  // null means there is nothing to show, for whatever reason (no picture, the switch off,
  // deleted, another community) -- and the wallet must not be able to tell those apart.
  //
  // ⛔ Filled in one batch by whoever builds the list (attachMessageAvatarDates), never by a
  // field resolver: a field resolver here would be one database round trip per message.
  @Field(() => Date, { nullable: true })
  userAvatarUpdatedAt: Date | null

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
