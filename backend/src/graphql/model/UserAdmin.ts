import { ObjectType, Field, Int } from 'type-graphql'
import { KlickTipp } from './KlickTipp'

@ObjectType()
export class UserAdmin {
  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string
}