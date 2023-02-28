import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { User } from './User'
import CONFIG from '@/config'

@ObjectType()
export class TransactionLink {
  constructor(transactionLink: dbTransactionLink, user: User, redeemedBy: User | null = null) {
    this.id = transactionLink.id
    this.user = user
    this.amount = transactionLink.amount
    this.holdAvailableAmount = transactionLink.holdAvailableAmount
    this.memo = transactionLink.memo
    this.code = transactionLink.code
    this.createdAt = transactionLink.createdAt
    this.validUntil = transactionLink.validUntil
    this.deletedAt = transactionLink.deletedAt
    this.redeemedAt = transactionLink.redeemedAt
    this.redeemedBy = redeemedBy
    this.link = CONFIG.COMMUNITY_REDEEM_URL.replace(/{code}/g, this.code)
  }

  @Field(() => Number)
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
}

@ObjectType()
export class TransactionLinkResult {
  @Field(() => Int)
  count: number

  @Field(() => [TransactionLink])
  links: TransactionLink[]
}
