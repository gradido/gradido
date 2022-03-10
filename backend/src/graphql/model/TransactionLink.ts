import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { User } from './User'

@ObjectType()
export class TransactionLink {
  constructor(transactionLink: dbTransactionLink, user: User) {
    this.id = transactionLink.id
    this.user = user
    this.amount = transactionLink.amount
    this.holdAvailableAmount = transactionLink.holdAvailableAmount
    this.memo = transactionLink.memo
    this.code = transactionLink.code
    this.createdAt = transactionLink.createdAt
    this.validUntil = transactionLink.validUntil
    this.showEmail = transactionLink.showEmail
    this.deletedAt = null // transactionLink.deletedAt
    this.redeemedAt = null // transactionLink.redeemedAt
    this.redeemedBy = null // transactionLink.redeemedBy
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

  @Field(() => Boolean)
  showEmail: boolean

  @Field(() => Date, { nullable: true })
  redeemedAt: Date | null

  @Field(() => User, { nullable: true })
  redeemedBy: User | null
}
