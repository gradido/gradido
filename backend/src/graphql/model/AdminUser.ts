import { User } from "@entity/User"
import { Field, Int, ObjectType } from "type-graphql"

@ObjectType()
export class AdminUser {
  constructor(user: User) {
    this.firstName = user.firstName
    this.lastName = user.lastName
  }

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string
}

@ObjectType()
export class SearchAdminUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [AdminUser])
  userList: AdminUser[]
}
