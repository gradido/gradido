import { User } from 'database'
import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class UserAdmin {
  constructor(user: User, creation: Decimal[], hasElopage: boolean, emailConfirmationSend: string) {
    this.userId = user.id
    this.email = user.emailContact?.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.creation = creation
    this.emailChecked = user.emailContact?.emailChecked
    this.hasElopage = hasElopage
    this.deletedAt = user.deletedAt
    this.createdAt = user.createdAt
    this.emailConfirmationSend = emailConfirmationSend
    this.roles = user.userRoles?.map((userRole) => userRole.role) ?? []
  }

  @Field(() => Int)
  userId: number

  @Field(() => String, { nullable: true })
  email: string | null

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [Decimal])
  creation: Decimal[]

  @Field(() => Boolean, { nullable: true })
  emailChecked: boolean | null

  @Field(() => Boolean)
  hasElopage: boolean

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date)
  createdAt: Date

  @Field(() => String, { nullable: true })
  emailConfirmationSend: string | null

  @Field(() => [String])
  roles: string[]
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
