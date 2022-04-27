import { ObjectType, Field } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class UpdatePendingCreation {
  @Field(() => Date)
  date: Date

  @Field(() => String)
  memo: string

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => Number)
  moderator: number

  @Field(() => [Decimal])
  creation: Decimal[]
}
