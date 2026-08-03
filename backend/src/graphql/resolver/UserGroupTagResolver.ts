import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { GroupTag } from '@/graphql/model/GroupTag'
import { Context, getUser } from '@/server/context'
import { loadModeratorScope, saveModeratorScope } from './util/moderatorGroupScope'
import { suggestGroupTagForUser } from './util/suggestGroupTag'
import { loadUserGroupTags, saveUserGroupTags } from './util/userGroupTags'

// Group functions: a user's personal group-tag list. Users manage their own
// list (first tag = main tag, pre-filled on submission); moderators may edit any user's
// list — healing a forgotten/misspelled tag at the source, not just on one contribution.
@Resolver(() => GroupTag)
export class UserGroupTagResolver {
  @Authorized([RIGHTS.MANAGE_OWN_GROUP_TAGS])
  @Query(() => [GroupTag])
  async myGroupTags(@Ctx() context: Context): Promise<GroupTag[]> {
    const user = getUser(context)
    return (await loadUserGroupTags(user.id)).map((tag) => new GroupTag(tag))
  }

  // What the group field is pre-filled with when submitting: the member's own last
  // statement, derived from their history — see suggestGroupTagForUser. The personal list
  // below is only the fallback for someone who has never said anything yet.
  @Authorized([RIGHTS.MANAGE_OWN_GROUP_TAGS])
  @Query(() => GroupTag, { nullable: true })
  async suggestedGroupTag(@Ctx() context: Context): Promise<GroupTag | null> {
    const user = getUser(context)
    return suggestGroupTagForUser(user.id)
  }

  @Authorized([RIGHTS.MANAGE_OWN_GROUP_TAGS])
  @Mutation(() => [GroupTag])
  async setMyGroupTags(
    @Arg('tags', () => [String]) tags: string[],
    @Ctx() context: Context,
  ): Promise<GroupTag[]> {
    const user = getUser(context)
    return (await saveUserGroupTags(user.id, tags)).map((tag) => new GroupTag(tag))
  }

  @Authorized([RIGHTS.MANAGE_USER_GROUP_TAGS])
  @Query(() => [GroupTag])
  async userGroupTags(@Arg('userId', () => Int) userId: number): Promise<GroupTag[]> {
    return (await loadUserGroupTags(userId)).map((tag) => new GroupTag(tag))
  }

  @Authorized([RIGHTS.MANAGE_USER_GROUP_TAGS])
  @Mutation(() => [GroupTag])
  async setUserGroupTags(
    @Arg('userId', () => Int) userId: number,
    @Arg('tags', () => [String]) tags: string[],
  ): Promise<GroupTag[]> {
    return (await saveUserGroupTags(userId, tags)).map((tag) => new GroupTag(tag))
  }

  // --- Moderator visibility scope (stored on user_roles; enforced in findContributions) ---
  @Authorized([RIGHTS.SET_MODERATOR_GROUP_SCOPE])
  @Query(() => [String])
  async moderatorGroupScope(@Arg('userId', () => Int) userId: number): Promise<string[]> {
    return loadModeratorScope(userId)
  }

  @Authorized([RIGHTS.SET_MODERATOR_GROUP_SCOPE])
  @Mutation(() => [String])
  async setModeratorGroupScope(
    @Arg('userId', () => Int) userId: number,
    @Arg('scope', () => [String]) scope: string[],
  ): Promise<string[]> {
    return saveModeratorScope(userId, scope)
  }
}
