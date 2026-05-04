import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class OpenCreation {
  @Field(() => Int)
  month: number

  @Field(() => Int)
  year: number

  @Field(() => GradidoUnit)
  amount: GradidoUnit
}
