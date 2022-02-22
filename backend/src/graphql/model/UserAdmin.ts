import { User } from '@entity/User'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class UserAdmin {
  constructor(user: User, creation: number[], hasElopage: boolean, emailConfirmationSend: string) {
    this.userId = user.id
    this.email = user.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.creation = creation
    this.emailChecked = user.emailChecked
    this.hasElopage = hasElopage
    this.deletedAt = user.deletedAt
    this.emailConfirmationSend = emailConfirmationSend
  }

  @Field(() => Number)
  userId: number

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [Number])
  creation: number[]

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => Boolean)
  hasElopage: boolean

  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null

  @Field(() => String, { nullable: true })
  emailConfirmationSend?: string
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
