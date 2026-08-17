import { GradidoUnit } from 'shared'
import { Field, Float, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class Balance {
  constructor(data: {
    balance: GradidoUnit
    balanceGDT: number | null
    count: number
    linkCount: number
    openLinkCount: number
  }) {
    this.balance = data.balance
    this.balanceGDT = data.balanceGDT ?? null
    this.count = data.count
    this.linkCount = data.linkCount
    this.openLinkCount = data.openLinkCount
  }

  // the actual balance, decay included
  @Field(() => GradidoUnit)
  balance: GradidoUnit

  @Field(() => Float, { nullable: true })
  balanceGDT: number | null

  // the count of all transactions
  @Field(() => Int)
  count: number

  // the count of transaction links that have not been redeemed, expired ones included.
  // This is what the list of links shows, so it is also what its paging counts against.
  @Field(() => Int)
  linkCount: number

  // the count of links that can still be redeemed: not redeemed, not deleted, not expired.
  // Fewer than linkCount, and the number a member is told about.
  @Field(() => Int)
  openLinkCount: number
}
