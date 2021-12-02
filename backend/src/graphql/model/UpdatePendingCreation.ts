import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class UpdatePendingCreation {
  @Field(() => Date)
  date: Date

  @Field(() => String)
  memo: string

  @Field(() => Number)
  amount: number

  @Field(() => Number)
  moderator: number

  @Field(() => [Number])
  creation: number[]
}
