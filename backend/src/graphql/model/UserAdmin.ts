import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class UserAdmin {
  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [Number])
  creation: number[]
}
