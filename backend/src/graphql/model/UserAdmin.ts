import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { User } from '@entity/User'

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
    this.isAdmin = user.isAdmin
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
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
