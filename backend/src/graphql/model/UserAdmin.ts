import { ObjectType, Field, Int } from 'type-graphql'
import { User } from '@entity/User'
import { ContributionMonth } from './ContributionMonth'

@ObjectType()
export class UserAdmin {
  constructor(
    user: User,
    creation: ContributionMonth[],
    hasElopage: boolean,
    emailConfirmationSend: string,
  ) {
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

  @Field(() => Number)
  userId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [ContributionMonth])
  creation: ContributionMonth[]

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => Boolean)
  hasElopage: boolean

  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null

  @Field(() => String, { nullable: true })
  emailConfirmationSend?: string

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
