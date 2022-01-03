import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class UserAdmin {
  @Field(() => Number)
  userId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [Number])
  creation: number[]

  @Field(() => Boolean)
  emailChecked: boolean
}
