/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { Decay } from './Decay'
import { Transaction as dbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { TransactionTypeId } from '../enum/TransactionTypeId'
import { User } from './User'

@ObjectType()
export class Transaction {
  constructor(transaction: dbTransaction, user: User, linkedUser: User | null = null) {
    this.id = transaction.id
    this.user = user
    this.previous = transaction.previous
    this.typeId = transaction.typeId
    this.amount = transaction.amount
    this.balance = transaction.balance
    this.balanceDate = transaction.balanceDate
    if (!transaction.decayStart) {
      this.decay = new Decay(transaction.balance, new Decimal(0), null, null, null)
    } else {
      this.decay = new Decay(
        transaction.balance,
        transaction.decay,
        transaction.decayStart,
        transaction.balanceDate,
        (transaction.balanceDate.getTime() - transaction.decayStart.getTime()) / 1000,
      )
    }
    this.memo = transaction.memo
    this.creationDate = transaction.creationDate
    this.linkedUser = linkedUser
    this.linkedTransactionId = transaction.linkedTransactionId
  }

  @Field(() => Number)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Number, { nullable: true })
  previous: number | null

  @Field(() => TransactionTypeId)
  typeId: TransactionTypeId

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Date)
  balanceDate: Date

  @Field(() => Decay)
  decay: Decay

  @Field(() => String)
  memo: string

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => User, { nullable: true })
  linkedUser: User | null

  @Field(() => Number, { nullable: true })
  linkedTransactionId?: number | null
}
