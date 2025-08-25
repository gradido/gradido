import { Transaction as dbTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

import { Decay, TransactionTypeId } from 'core'

import { User } from './User'

@ObjectType()
export class Transaction {
  constructor(transaction: dbTransaction, user: User, linkedUser: User | null = null) {
    this.id = transaction.id
    this.user = user
    this.previous = transaction.previous
    this.typeId = transaction.typeId
    this.amount = transaction.amount.toDecimalPlaces(2, Decimal.ROUND_DOWN)
    this.balance = transaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN)
    this.balanceDate = transaction.balanceDate
    if (!transaction.decayStart) {
      // TODO: hot fix, we should separate decay calculation from decay graphql model
      this.decay = new Decay({
        balance: transaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN),
        decay: new Decimal(0),
        roundedDecay: new Decimal(0),
        start: null,
        end: null,
        duration: null,
      })
    } else {
      this.decay = new Decay({
        balance: transaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN),
        decay: transaction.decay.toDecimalPlaces(2, Decimal.ROUND_FLOOR),
        // TODO: add correct value when decay must be rounded in transaction context
        roundedDecay: new Decimal(0),
        start: transaction.decayStart,
        end: transaction.balanceDate,
        duration: Math.round(
          (transaction.balanceDate.getTime() - transaction.decayStart.getTime()) / 1000,
        ),
      })
    }
    this.memo = transaction.memo
    this.creationDate = transaction.creationDate
    this.linkedUser = linkedUser
    this.linkedTransactionId = transaction.linkedTransactionId ?? null
    this.linkId = transaction.contribution
      ? transaction.contribution.contributionLinkId
      : (transaction.transactionLinkId ?? null)
    this.previousBalance =
      transaction.previousTransaction?.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN) ??
      new Decimal(0)
  }

  @Field(() => Int)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Int, { nullable: true })
  previous: number | null

  @Field(() => TransactionTypeId)
  typeId: TransactionTypeId

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Date)
  balanceDate: Date

  @Field(() => Decimal)
  previousBalance: Decimal

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
