import { User } from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class UserAdmin {
  constructor(
    user: User,
    creation: GradidoUnit[],
    hasElopage: boolean,
    emailConfirmationSend: string,
  ) {
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
    this.role = user.userRole?.role ?? null
    this.creationAllowed = user.creationAllowed
  }

  @Field(() => Int)
  userId: number

  @Field(() => String, { nullable: true })
  email: string | null

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => [GradidoUnit])
  creation: GradidoUnit[]

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

  // 0..1 role: user_roles.user_id is UNIQUE (migration 0135). Null for a usual member.
  @Field(() => String, { nullable: true })
  role: string | null

  // ES-021: the admin's "may create" switch reads its position from here.
  @Field(() => Boolean)
  creationAllowed: boolean
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
