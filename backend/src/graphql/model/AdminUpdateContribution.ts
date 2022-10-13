import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { ContributionMonth } from './ContributionMonth'

@ObjectType()
export class AdminUpdateContribution {
  @Field(() => Date)
  date: Date

  @Field(() => String)
  memo: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => [ContributionMonth])
  creation: ContributionMonth[]
}
