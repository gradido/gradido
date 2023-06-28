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
      switch (user.userRoles[0].role) {
        case ROLE_NAMES.ROLE_NAME_ADMIN:
          this.isAdmin = user.userRoles[0].createdAt
          break
        case ROLE_NAMES.ROLE_NAME_MODERATOR:
          this.isModerator = user.userRoles[0].createdAt
          break
        default:
          this.isAdmin = null
          this.isModerator = null
      }
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

  @Field(() => Date, { nullable: true })
  isAdmin: Date | null

  @Field(() => Date, { nullable: true })
  isModerator: Date | null
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
