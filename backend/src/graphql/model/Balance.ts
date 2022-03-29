import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'
import CONFIG from '@/config'

@ObjectType()
export class Balance {
  constructor(data: {
    balance: Decimal
    decay: Decimal
    lastBookedBalance: Decimal
    balanceGDT: number | null
    count: number
    linkCount: number
    decayStartBlock?: Date
    lastBookedDate?: Date | null
  }) {
    this.balance = data.balance
    this.decay = data.decay
    this.lastBookedBalance = data.lastBookedBalance
    this.balanceGDT = data.balanceGDT || null
    this.count = data.count
    this.linkCount = data.linkCount
    this.decayStartBlock = data.decayStartBlock || CONFIG.DECAY_START_TIME
    this.lastBookedDate = data.lastBookedDate || null
  }

  // the actual balance, decay included
  @Field(() => Decimal)
  balance: Decimal

  // the decay since the last booked balance
  @Field(() => Decimal)
  decay: Decimal

  @Field(() => Decimal)
  lastBookedBalance: Decimal

  @Field(() => Number, { nullable: true })
  balanceGDT: number | null

  // the count of all transactions
  @Field(() => Number)
  count: number

  // the count of transaction links
  @Field(() => Number)
  linkCount: number

  @Field(() => Date)
  decayStartBlock: Date

  // may be null as there may be no transaction
  @Field(() => Date, { nullable: true })
  lastBookedDate: Date | null
}
