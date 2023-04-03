import { Decimal } from 'decimal.js-light'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class AdminUpdateContribution {
  @Field(() => Date)
  date: Date

  @Field(() => String)
  memo: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => [Decimal])
  creation: Decimal[]
}
