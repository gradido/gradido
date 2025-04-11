import { Community as DbCommunity } from '@entity/Community'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { Decimal } from 'decimal.js-light'
import { ObjectType, Field, Int } from 'type-graphql'

import { CONFIG } from '@/config'

import { Community } from './Community'
import { User } from './User'

@ObjectType()
export class TransactionLink {
  constructor(
    dbTransactionLink?: DbTransactionLink,
    user?: User,
    redeemedBy?: User,
    dbCommunities?: DbCommunity[],
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
      this.user = user
    }
    if (redeemedBy !== undefined) {
      this.redeemedBy = redeemedBy
    }
    if (dbCommunities !== undefined) {
      this.communities = dbCommunities.map((dbCom: DbCommunity) => new Community(dbCom))
    }
  }

  @Field(() => Int)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Decimal)
  holdAvailableAmount: Decimal

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
}

@ObjectType()
export class TransactionLinkResult {
  @Field(() => Int)
  count: number

  @Field(() => [TransactionLink])
  links: TransactionLink[]
}
