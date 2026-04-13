import { TransactionTypeId } from 'core'
import { Transaction as dbTransaction } from 'database'
import Decimal from 'decimal.js-light'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'
import { Decay } from './Decay'
import { User } from './User'

@ObjectType()
export class Transaction {
  constructor(transaction: dbTransaction, user: User, linkedUser: User | null = null) {
    this.id = transaction.id
    this.user = user
    this.previous = transaction.previous
    this.typeId = transaction.typeId
    this.amount = GradidoUnit.fromDecimal(transaction.amount.toDecimalPlaces(4, Decimal.ROUND_DOWN))
    this.balance = GradidoUnit.fromDecimal(
      transaction.balance.toDecimalPlaces(4, Decimal.ROUND_DOWN),
    )
    this.balanceDate = transaction.balanceDate
    this.decay = Decay.createFromDBTransaction(transaction)
    this.memo = transaction.memo
    this.creationDate = transaction.creationDate
    this.linkedUser = linkedUser
    this.linkedTransactionId = transaction.linkedTransactionId ?? null
    this.linkId = transaction.contribution
      ? transaction.contribution.contributionLinkId
      : (transaction.transactionLinkId ?? null)
    this.previousBalance = GradidoUnit.fromDecimal(
      transaction.previousTransaction?.balance.toDecimalPlaces(4, Decimal.ROUND_DOWN) ??
        new Decimal(0),
    )
  }

  @Field(() => Int)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Int, { nullable: true })
  previous: number | null

  @Field(() => TransactionTypeId)
  typeId: TransactionTypeId

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => GradidoUnit)
  balance: GradidoUnit

  @Field(() => Date)
  balanceDate: Date

  @Field(() => GradidoUnit)
  previousBalance: GradidoUnit

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
