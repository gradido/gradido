import { User } from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'

import { isFindableOnMap } from '@/graphql/resolver/util/findableOnMap'

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
    this.alias = user.alias || null
    this.creation = creation
    this.emailChecked = user.emailContact?.emailChecked
    this.hasElopage = hasElopage
    this.deletedAt = user.deletedAt
    this.createdAt = user.createdAt
    this.emailConfirmationSend = emailConfirmationSend
    this.role = user.userRole?.role ?? null
    this.creationAllowed = user.creationAllowed
    this.gradidoID = user.gradidoID
    this.communityUuid = user.communityUuid
    this.findableOnMap = isFindableOnMap(user)
  }

  @Field(() => Int)
  userId: number

  @Field(() => String, { nullable: true })
  email: string | null

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  // The username as it is stored, null where the member has none. The search finds people
  // by it, so the table shows it; no gradidoID stands in here, an empty cell says more.
  @Field(() => String, { nullable: true })
  alias: string | null

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

  // The pair that names a member everywhere. The pin behind the username addresses the
  // wallet's map by it; the username cell above still shows the alias and nothing else.
  @Field(() => String)
  gradidoID: string

  @Field(() => String)
  communityUuid: string

  // Whether the member stands on the map of the member search (isFindableOnMap): the table
  // shows the pin for these members only. A yes or no, never the place. No guard of its
  // own -- this type leaves through `searchUsers` alone, behind SEARCH_USERS.
  @Field(() => Boolean)
  findableOnMap: boolean
}

@ObjectType()
export class SearchUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [UserAdmin])
  userList: UserAdmin[]
}
