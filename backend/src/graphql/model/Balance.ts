import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class Balance {
  constructor(data: {
    balance: Decimal
    balanceGDT: number | null
    count: number
    linkCount: number
  }) {
    this.balance = data.balance
    this.balanceGDT = data.balanceGDT || null
    this.count = data.count
    this.linkCount = data.linkCount
  }

  // the actual balance, decay included
  @Field(() => Decimal)
  balance: Decimal

  @Field(() => Number, { nullable: true })
  balanceGDT: number | null

  // the count of all transactions
  @Field(() => Number)
  count: number

  // the count of transaction links
  @Field(() => Number)
  linkCount: number
}
