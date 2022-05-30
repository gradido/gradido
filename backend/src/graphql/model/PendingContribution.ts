import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class PendingContribution {
  @Field(() => String)
  firstName: string

  @Field(() => Int)
  id?: number

  @Field(() => String)
  lastName: string

  @Field(() => Number)
  userId: number

  @Field(() => String)
  email: string

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
