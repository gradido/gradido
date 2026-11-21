import { dbSelectCreationGroupIdsIn, dbUpdateUserRoleHandledCreationGroups } from 'database'
import { getLogger } from 'log4js'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  handledCreationGroupsOf,
  normaliseHandledCreationGroups,
  storedHandledCreationGroups,
} from '@/data/HandledCreationGroups.logic'
import { CreationGroup } from '@/graphql/model/CreationGroup'
import { HandledCreationGroups } from '@/graphql/model/HandledCreationGroups'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import {
  describeModeratorCreationGroups,
  loadModeratorScope,
  saveModeratorScope,
} from './util/moderatorCreationGroupScope'
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
  @Authorized([RIGHTS.SET_MODERATOR_CREATION_GROUP_SCOPE])
  @Query(() => [String])
  async moderatorCreationGroupScope(@Arg('userId', () => Int) userId: number): Promise<string[]> {
    return loadModeratorScope(userId)
  }

  @Authorized([RIGHTS.SET_MODERATOR_CREATION_GROUP_SCOPE])
  @Mutation(() => [String])
  async setModeratorCreationGroupScope(
    @Arg('userId', () => Int) userId: number,
    @Arg('scope', () => [String]) scope: string[],
  ): Promise<string[]> {
    return saveModeratorScope(userId, scope)
  }

  // --- "Meine Gruppen" (MG1): the creation groups the signed-in moderator handles themself ---
  // ⚠️ Not the lists above: myCreationGroups is a member's own list for the wallet's submission
  // field, and the scope is what an administrator assigns. This is the caller's own choice, on
  // their role row, read by the admin's start page, its count and its group filter
  // (HANDLED_FILTER in findContributions).

  // The choice in force, from the role row the request loaded: nothing is read here. Empty where
  // no choice counts -- nothing chosen, or a moderator with an assigned scope.
  @Authorized([RIGHTS.HANDLED_CREATION_GROUPS])
  @Query(() => HandledCreationGroups)
  handledCreationGroups(@Ctx() context: Context): HandledCreationGroups {
    const role = getUser(context).userRole
    return new HandledCreationGroups(
      handledCreationGroupsOf(
        role?.handledCreationGroups,
        describeModeratorCreationGroups(role).seesAllCreationGroups,
      ) ?? { groupIds: [], untagged: false },
    )
  }

  // Saves the whole choice, and answers it as stored: each group once, ascending. The choice of
  // nothing stores null, "everything, as before". A moderator with an assigned scope has no choice
  // to save -- their scope is their list.
  @Authorized([RIGHTS.HANDLED_CREATION_GROUPS])
  @Mutation(() => HandledCreationGroups)
  async setHandledCreationGroups(
    @Arg('groupIds', () => [Int]) groupIds: number[],
    @Arg('untagged', () => Boolean) untagged: boolean,
    @Ctx() context: Context,
  ): Promise<HandledCreationGroups> {
    const user = getUser(context)
    if (!describeModeratorCreationGroups(user.userRole).seesAllCreationGroups) {
      throw new LogError('An assigned scope leaves no creation groups to choose', user.id)
    }
    const choice = normaliseHandledCreationGroups(groupIds, untagged)
    if (!choice.success) {
      throw new LogError(choice.error.message, user.id)
    }
    const known = await dbSelectCreationGroupIdsIn(choice.value.groupIds)
    if (known.length !== choice.value.groupIds.length) {
      const unknown = choice.value.groupIds.filter((id) => !known.includes(id))
      throw new LogError('Unknown creation group(s)', unknown.join(', '))
    }
    const written = await dbUpdateUserRoleHandledCreationGroups(
      user.id,
      storedHandledCreationGroups(choice.value),
    )
    if (!written.success) {
      throw new LogError('No role to save the creation groups on', user.id)
    }
    getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.UserCreationGroupResolver`).info(
      `handled creation groups of user ${user.id} set: ${choice.value.groupIds.length} groups, untagged ${choice.value.untagged}`,
    )
    return new HandledCreationGroups(choice.value)
  }
}
