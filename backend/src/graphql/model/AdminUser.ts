import { User } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { describeModeratorCreationGroups } from '@/graphql/resolver/util/moderatorCreationGroupScope'

@ObjectType()
export class AdminUser {
  constructor(user: User) {
    const role = user.userRoles.length > 0 ? user.userRoles[0] : null
    const groups = describeModeratorCreationGroups(role)
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.role = role ? role.role : ''
    this.visibleCreationGroups = groups.tags
    this.seesAllCreationGroups = groups.seesAllCreationGroups
    this.seesUntagged = groups.seesUntagged
  }

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  role: string

  // Group functions: the groups this moderator looks after, so the community
  // info page can list them under that group. Canonical tags without the leading '#' —
  // the display names come from the group list itself and are not duplicated here.
  @Field(() => [String])
  visibleCreationGroups: string[]

  // True when no group restriction applies: an unassigned moderator sees every group.
  @Field(() => Boolean)
  seesAllCreationGroups: boolean

  // True when the scope covers contributions that carry no group. Separate from the tag
  // list because "no group" is not a group; without it a scope of "one group plus the
  // ungrouped ones" would be indistinguishable from that one group alone.
  @Field(() => Boolean)
  seesUntagged: boolean
}

@ObjectType()
export class SearchAdminUsersResult {
  @Field(() => Int)
  userCount: number

  @Field(() => [AdminUser])
  userList: AdminUser[]
}
