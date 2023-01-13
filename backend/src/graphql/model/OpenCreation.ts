import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'

@ObjectType()
export class OpenCreation {
  @Field(() => Int)
  month: number

  @Field(() => Int)
  year: number

  @Field(() => Decimal)
  amount: Decimal
}
