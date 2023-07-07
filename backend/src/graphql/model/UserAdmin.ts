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
    if (user.userRoles) {
      this.roles = [] as string[]
      user.userRoles.forEach((userRole) => {
        this.roles?.push(userRole.role)
      })
    }
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

  @Field(() => [String], { nullable: true })
  roles: string[] | null

  @Field(() => Boolean)
  isAdmin(): boolean {
    if (this.roles) {
      return this.roles.includes(ROLE_NAMES.ROLE_NAME_ADMIN)
    }
    return false
  }

  @Field(() => Boolean)
  isModerator(): boolean {
    if (this.roles) {
      return this.roles.includes(ROLE_NAMES.ROLE_NAME_MODERATOR)
    }
    return false
  }
}


@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
