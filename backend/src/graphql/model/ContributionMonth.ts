import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class ContributionMonth {
  constructor(amount: Decimal, targetMonth: number) {
    this.amount = amount
    this.targetMonth = targetMonth
  }

  // the free amount for creation in the targetDate
  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Number)
  targetMonth: number
}
