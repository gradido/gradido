import type { User } from '@entity/User'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class AdminUser {
  constructor(user: User) {
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.role = user.userRoles.length > 0 ? user.userRoles[0].role : ''
  }

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  role: string
}

@ObjectType()
export class SearchAdminUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [AdminUser])
  userList: AdminUser[]
}
