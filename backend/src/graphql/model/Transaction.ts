import { Decay, TransactionTypeId } from 'core'
import { Transaction as dbTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

import { User } from './User'

@ObjectType()
export class Transaction {
  constructor(transaction: dbTransaction, user: User, linkedUser: User | null = null) {
    this.id = transaction.id
    this.user = user
    this.previous = transaction.previous
    this.typeId = transaction.typeId
    this.amount = transaction.amount.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString()
    this.balance = transaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString()
    this.balanceDate = transaction.balanceDate
    this.decay = new Decay(transaction)
    this.memo = transaction.memo
    this.creationDate = transaction.creationDate
    this.linkedUser = linkedUser
    this.linkedTransactionId = transaction.linkedTransactionId ?? null
    this.linkId = transaction.contribution
      ? transaction.contribution.contributionLinkId
      : (transaction.transactionLinkId ?? null)
    this.previousBalance =
      transaction.previousTransaction?.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString() ??
      '0'
  }

  @Field(() => Int)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Int, { nullable: true })
  previous: number | null

  @Field(() => TransactionTypeId)
  typeId: TransactionTypeId

  @Field(() => String)
  amount: string

  @Field(() => String)
  balance: string

  @Field(() => Date)
  balanceDate: Date

  @Field(() => String)
  previousBalance: string

  @Field(() => Decay)
  decay: Decay

  @Field(() => String)
  memo: string

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => User, { nullable: true })
  linkedUser: User | null

  @Field(() => Int, { nullable: true })
  linkedTransactionId: number | null

  // Links to the TransactionLink/ContributionLink when transaction was created by a link
  @Field(() => Int, { nullable: true })
  linkId: number | null
}
