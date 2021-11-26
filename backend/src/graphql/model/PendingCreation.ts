import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class PendingCreation {
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
  note: string

  @Field(() => Number)
  amount: BigInt

  @Field(() => Number)
  moderator: number
}
