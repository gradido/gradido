import { GradidoUnit } from 'shared'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class AdminUpdateContribution {
  @Field(() => Date)
  date: Date

  @Field(() => String)
  memo: string

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => [GradidoUnit])
  creation: GradidoUnit[]
}
