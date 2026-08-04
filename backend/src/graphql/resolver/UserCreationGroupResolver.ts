import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CreationGroup } from '@/graphql/model/CreationGroup'
import { Context, getUser } from '@/server/context'
import { loadModeratorScope, saveModeratorScope } from './util/moderatorCreationGroupScope'
import { suggestCreationGroupForUser } from './util/suggestCreationGroup'
import { loadUserCreationGroups, saveUserCreationGroups } from './util/userCreationGroups'

// Group functions: a user's personal creation-group list. Users manage their own
// list (first tag = main tag, pre-filled on submission); moderators may edit any user's
// list — healing a forgotten/misspelled tag at the source, not just on one contribution.
@Resolver(() => CreationGroup)
export class UserCreationGroupResolver {
  @Authorized([RIGHTS.MANAGE_OWN_CREATION_GROUPS])
  @Query(() => [CreationGroup])
  async myCreationGroups(@Ctx() context: Context): Promise<CreationGroup[]> {
    const user = getUser(context)
    return (await loadUserCreationGroups(user.id)).map((tag) => new CreationGroup(tag))
  }

  // What the group field is pre-filled with when submitting: the member's own last
  // statement, derived from their history — see suggestCreationGroupForUser. The personal list
  // below is only the fallback for someone who has never said anything yet.
  @Authorized([RIGHTS.MANAGE_OWN_CREATION_GROUPS])
  @Query(() => CreationGroup, { nullable: true })
  async suggestedCreationGroup(@Ctx() context: Context): Promise<CreationGroup | null> {
    const user = getUser(context)
    return suggestCreationGroupForUser(user.id)
  }

  @Authorized([RIGHTS.MANAGE_OWN_CREATION_GROUPS])
  @Mutation(() => [CreationGroup])
  async setMyCreationGroups(
    @Arg('tags', () => [String]) tags: string[],
    @Ctx() context: Context,
  ): Promise<CreationGroup[]> {
    const user = getUser(context)
    return (await saveUserCreationGroups(user.id, tags)).map((tag) => new CreationGroup(tag))
  }

  @Authorized([RIGHTS.MANAGE_USER_CREATION_GROUPS])
  @Query(() => [CreationGroup])
  async userCreationGroups(@Arg('userId', () => Int) userId: number): Promise<CreationGroup[]> {
    return (await loadUserCreationGroups(userId)).map((tag) => new CreationGroup(tag))
  }

  @Authorized([RIGHTS.MANAGE_USER_CREATION_GROUPS])
  @Mutation(() => [CreationGroup])
  async setUserCreationGroups(
    @Arg('userId', () => Int) userId: number,
    @Arg('tags', () => [String]) tags: string[],
  ): Promise<CreationGroup[]> {
    return (await saveUserCreationGroups(userId, tags)).map((tag) => new CreationGroup(tag))
  }

  // --- Moderator visibility scope (stored on user_roles; enforced in findContributions) ---
  @Authorized([RIGHTS.SET_MODERATOR_GROUP_SCOPE])
  @Query(() => [String])
  async moderatorCreationGroupScope(@Arg('userId', () => Int) userId: number): Promise<string[]> {
    return loadModeratorScope(userId)
  }

  @Authorized([RIGHTS.SET_MODERATOR_GROUP_SCOPE])
  @Mutation(() => [String])
  async setModeratorCreationGroupScope(
    @Arg('userId', () => Int) userId: number,
    @Arg('scope', () => [String]) scope: string[],
  ): Promise<string[]> {
    return saveModeratorScope(userId, scope)
  }
}
