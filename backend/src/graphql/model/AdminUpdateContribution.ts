import { Decimal } from 'decimal.js-light'
import { Field, ObjectType } from 'type-graphql'

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
