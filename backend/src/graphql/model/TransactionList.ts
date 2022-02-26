/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Decimal from 'decimal.js-light'
import { ObjectType, Field } from 'type-graphql'
import { Transaction } from './Transaction'

@ObjectType()
export class TransactionList {
  constructor() {
    this.gdtSum = 0
    this.count = 0
    this.balance = new Decimal(0)
    this.decayStartBlock = null
  }

  @Field(() => Number, { nullable: true })
  gdtSum: number | null

  @Field(() => Number)
  count: number

  @Field(() => Number)
  balance: Decimal

  @Field(() => Date, { nullable: true })
  decayStartBlock: Date | null

  @Field(() => [Transaction])
  transactions: Transaction[]
}
