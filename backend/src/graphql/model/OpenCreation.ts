import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class OpenCreation {
  @Field(() => Int)
  month: number

  @Field(() => Int)
  year: number

  @Field(() => Decimal)
  amount: Decimal
}
