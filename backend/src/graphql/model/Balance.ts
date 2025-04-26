import { Decimal } from 'decimal.js-light'
import { Field, Float, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class Balance {
  constructor(data: {
    balance: Decimal
    balanceGDT: number | null
    count: number
    linkCount: number
  }) {
    this.balance = data.balance
    this.balanceGDT = data.balanceGDT ?? null
    this.count = data.count
    this.linkCount = data.linkCount
  }

  // the actual balance, decay included
  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Float, { nullable: true })
  balanceGDT: number | null

  // the count of all transactions
  @Field(() => Int)
  count: number

  // the count of transaction links
  @Field(() => Int)
  linkCount: number
}
