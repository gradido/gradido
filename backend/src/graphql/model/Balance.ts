import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class Balance {
  constructor(data: {
    balance: Decimal
    decay: Decimal
    lastBookedBalance: Decimal
    balanceGDT: number | null
    count: number
    linkCount: number
    lastBookedDate?: Date | null
  }) {
    this.balance = data.balance
    this.decay = data.decay
    this.lastBookedBalance = data.lastBookedBalance
    this.balanceGDT = data.balanceGDT || null
    this.count = data.count
    this.linkCount = data.linkCount
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

  // may be null as there may be no transaction
  @Field(() => Date, { nullable: true })
  lastBookedDate: Date | null
}
