import { User } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { describeModeratorCreationGroups } from '@/graphql/resolver/util/moderatorCreationGroupScope'

@ObjectType()
export class AdminUser {
  constructor(user: User) {
    const role = user.userRoles.length > 0 ? user.userRoles[0] : null
    const groups = describeModeratorCreationGroups(role)
    this.alias = new PublishNameLogic(user).getPublicAlias()
    this.role = role ? role.role : ''
    this.visibleCreationGroups = groups.tags
    this.seesAllCreationGroups = groups.seesAllCreationGroups
    this.seesUntagged = groups.seesUntagged
  }

  // The alias is all this type says about who a moderator is (NU-021): it is handed to
  // every signed-in member for the community info page, and the field resolver that
  // guards User.firstName cannot reach a type of its own -- so the real name is simply
  // not on it. Where there is no usable alias the gradidoID stands in, through the one
  // rule that decides this (NU-018) -- a bare `?? ` here would have let a one- or
  // two-character legacy alias through that every other screen rejects. Seeded
  // environments -- the ki-playground among them -- have an admin without an alias, and
  // that admin must not read as a blank row on the community info page. Never null, so
  // the page can sort and key on it.
  @Field(() => String)
  alias: string

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
