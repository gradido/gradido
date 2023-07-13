import { User } from '@entity/User'
import { Decimal } from 'decimal.js-light'
import { ObjectType, Field, Int } from 'type-graphql'

import { ROLE_NAMES } from '@/auth/ROLES'

@ObjectType()
export class UserAdmin {
  constructor(user: User, creation: Decimal[], hasElopage: boolean, emailConfirmationSend: string) {
    this.userId = user.id
    this.email = user.emailContact.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.creation = creation
    this.emailChecked = user.emailContact.emailChecked
    this.hasElopage = hasElopage
    this.deletedAt = user.deletedAt
    this.emailConfirmationSend = emailConfirmationSend
    this.roles = user.userRoles?.map((userRole) => userRole.role) ?? []
  }

  @Field(() => Int)
  userId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [Decimal])
  creation: Decimal[]

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => Boolean)
  hasElopage: boolean

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => String, { nullable: true })
  emailConfirmationSend: string | null

  @Field(() => [String])
  roles: string[]

  @Field(() => Boolean)
  isAdmin(): boolean {
    return this.roles.includes(ROLE_NAMES.ROLE_NAME_ADMIN)
  }

  @Field(() => Boolean)
  isModerator(): boolean {
    return this.roles.includes(ROLE_NAMES.ROLE_NAME_MODERATOR)
  }
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
