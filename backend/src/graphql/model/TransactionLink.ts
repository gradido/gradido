import { Community as DbCommunity, TransactionLink as DbTransactionLink } from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'
import { CONFIG } from '@/config'

import { Community } from './Community'
import { ThankYouGreeting } from './ThankYouGreeting'
import { User } from './User'

@ObjectType()
export class TransactionLink {
  constructor(
    dbTransactionLink?: DbTransactionLink,
    user?: User,
    redeemedBy?: User,
    dbCommunities?: DbCommunity[],
    greeting?: ThankYouGreeting | null,
    senderAvatar?: Buffer | null,
  ) {
    if (dbTransactionLink !== undefined) {
      this.id = dbTransactionLink.id
      this.amount = dbTransactionLink.amount
      this.holdAvailableAmount = dbTransactionLink.holdAvailableAmount
      this.memo = dbTransactionLink.memo
      this.code = dbTransactionLink.code
      this.link = CONFIG.COMMUNITY_REDEEM_URL + this.code
      this.createdAt = dbTransactionLink.createdAt
      this.validUntil = dbTransactionLink.validUntil
      this.deletedAt = dbTransactionLink.deletedAt
      this.redeemedAt = dbTransactionLink.redeemedAt
    }
    if (user !== undefined) {
      this.senderUser = user
    }
    if (redeemedBy !== undefined) {
      this.redeemedBy = redeemedBy
    }
    if (dbCommunities !== undefined) {
      this.communities = dbCommunities.map((dbCom: DbCommunity) => new Community(dbCom))
    }
    this.greeting = greeting ?? null
    this.senderAvatar = senderAvatar ? senderAvatar.toString('base64') : null
  }

  @Field(() => Int)
  id: number

  @Field(() => User)
  senderUser: User

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => GradidoUnit)
  holdAvailableAmount: GradidoUnit

  @Field(() => String)
  memo: string

  @Field(() => String)
  code: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date)
  validUntil: Date

  @Field(() => Date, { nullable: true })
  redeemedAt: Date | null

  @Field(() => User, { nullable: true })
  redeemedBy: User | null

  @Field(() => String)
  link: string

  @Field(() => String)
  communityName: string

  @Field(() => [Community])
  communities: Community[]

  /**
   * What makes this link a thank-you greeting; null for a plain link. Handed in by whoever
   * builds the model -- one read for a whole page of links, not one per link.
   */
  @Field(() => ThankYouGreeting, { nullable: true })
  greeting: ThankYouGreeting | null

  /**
   * The small picture of the member who made the link, base64 without a data-URI prefix like
   * User.avatar -- for whoever holds the code of an OPEN link, and only where the member shows
   * their face to other members (mayBeShownToMembers); null everywhere else (SenderAvatar.logic).
   * Handed in by the one caller that reads it, queryTransactionLink; the lists and
   * createTransactionLink pass nothing.
   */
  @Field(() => String, { nullable: true })
  senderAvatar: string | null
}

@ObjectType()
export class TransactionLinkResult {
  @Field(() => Int)
  count: number

  @Field(() => [TransactionLink])
  links: TransactionLink[]
}
