import { ObjectType, Field } from 'type-graphql'
import CONFIG from '@/config'
import Decimal from 'decimal.js-light'
import { Transaction } from './Transaction'

@ObjectType()
export class TransactionList {
  constructor(
    balance: Decimal,
    transactions: Transaction[],
    count: number,
    linkCount: number,
    balanceGDT?: number | null,
    decayStartBlock: Date = CONFIG.DECAY_START_TIME,
  ) {
    this.balance = balance
    this.transactions = transactions
    this.count = count
    this.linkCount = linkCount
    this.balanceGDT = balanceGDT || null
    this.decayStartBlock = decayStartBlock
  }

  @Field(() => Number, { nullable: true })
  balanceGDT: number | null

  @Field(() => Number)
  count: number

  @Field(() => Number)
  linkCount: number

  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Date)
  decayStartBlock: Date

  @Field(() => [Transaction])
  transactions: Transaction[]
}
