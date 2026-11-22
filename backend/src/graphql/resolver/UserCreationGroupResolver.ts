import { HandledGroupsInput } from '@input/HandledGroupsInput'
import { dbSelectCreationGroupIdsIn, dbUpdateUserRoleHandledGroups } from 'database'
import { getLogger } from 'log4js'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  normaliseHandledCreationGroups,
  storedHandledCreationGroups,
} from '@/data/HandledCreationGroups.logic'
import { CreationGroup } from '@/graphql/model/CreationGroup'
import { HandledCreationGroups } from '@/graphql/model/HandledCreationGroups'
import { HandledGroups } from '@/graphql/model/HandledGroups'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import {
  describeModeratorCreationGroups,
  handledCreationGroupsOfRole,
  handledSupportGroupsOfRole,
  loadModeratorScope,
  maySwitchHandledGroupsOff,
  saveModeratorScope,
} from './util/moderatorCreationGroupScope'
import { suggestCreationGroupForUser } from './util/suggestCreationGroup'
import { loadUserCreationGroups, saveUserCreationGroups } from './util/userCreationGroups'

// What the queries of "Meine Gruppen" answer where no choice counts.
const NO_CHOICE = { groupIds: [], untagged: false, off: false }

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

  // --- "Meine Gruppen" (MG1, MG2b): the creation groups the signed-in moderator handles themself ---
  // ⚠️ Not the lists above: myCreationGroups is a member's own list for the wallet's submission
  // field, and the scope is what an administrator assigns. This is the caller's own choice, on
  // their role row, in two columns: the groups whose creations they handle -- read by the admin's
  // start page, its counts and the creation page's group filter (HANDLED_FILTER in findContributions)
  // -- and the groups whose support requests they handle, read by the support's list and count.

  // The choice in force, from the role row the request loaded: nothing is read here. Empty where
  // no choice counts -- nothing chosen, or a moderator with an assigned scope.
  @Authorized([RIGHTS.HANDLED_CREATION_GROUPS])
  @Query(() => HandledCreationGroups)
  handledCreationGroups(@Ctx() context: Context): HandledCreationGroups {
    return new HandledCreationGroups(
      handledCreationGroupsOfRole(getUser(context).userRole) ?? NO_CHOICE,
    )
  }

  // The same for the column "Support" (MG2b): the support page's group filter asks this one.
  @Authorized([RIGHTS.HANDLED_CREATION_GROUPS])
  @Query(() => HandledCreationGroups)
  handledSupportGroups(@Ctx() context: Context): HandledCreationGroups {
    return new HandledCreationGroups(
      handledSupportGroupsOfRole(getUser(context).userRole) ?? NO_CHOICE,
    )
  }

  // Saves both columns at once, in one statement, and answers them as stored: each group once,
  // ascending. A column of nothing stores null, "everything, as before"; one that is off (MG5)
  // stores its ticks behind the switch. Both are checked before anything is written, so a refusal
  // keeps what was there in both. A moderator with an assigned scope has no choice to save -- their
  // scope is their list --, and any other moderator no switch (maySwitchHandledGroupsOff).
  @Authorized([RIGHTS.HANDLED_CREATION_GROUPS])
  @Mutation(() => HandledGroups)
  async setHandledGroups(
    @Arg('creation', () => HandledGroupsInput) creationInput: HandledGroupsInput,
    @Arg('support', () => HandledGroupsInput) supportInput: HandledGroupsInput,
    @Ctx() context: Context,
  ): Promise<HandledGroups> {
    const user = getUser(context)
    if (!describeModeratorCreationGroups(user.userRole).seesAllCreationGroups) {
      throw new LogError('An assigned scope leaves no creation groups to choose', user.id)
    }
    if ((creationInput.off || supportInput.off) && !maySwitchHandledGroupsOff(user.userRole)) {
      throw new LogError('Only an administrator may switch an area off', user.id)
    }
    const creation = normaliseHandledCreationGroups(
      creationInput.groupIds,
      creationInput.untagged,
      creationInput.off,
    )
    if (!creation.success) {
      throw new LogError(creation.error.message, user.id)
    }
    const support = normaliseHandledCreationGroups(
      supportInput.groupIds,
      supportInput.untagged,
      supportInput.off,
    )
    if (!support.success) {
      throw new LogError(support.error.message, user.id)
    }
    const named = [...new Set([...creation.value.groupIds, ...support.value.groupIds])]
    const known = await dbSelectCreationGroupIdsIn(named)
    if (known.length !== named.length) {
      const unknown = named.filter((id) => !known.includes(id))
      throw new LogError('Unknown creation group(s)', unknown.join(', '))
    }
    const written = await dbUpdateUserRoleHandledGroups(user.id, {
      creation: storedHandledCreationGroups(creation.value),
      support: storedHandledCreationGroups(support.value),
    })
    if (!written.success) {
      throw new LogError('No role to save the creation groups on', user.id)
    }
    getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.UserCreationGroupResolver`).info(
      `handled groups of user ${user.id} set: creation ${creation.value.groupIds.length} groups, untagged ${creation.value.untagged}, off ${creation.value.off}; support ${support.value.groupIds.length} groups, untagged ${support.value.untagged}, off ${support.value.off}`,
    )
    return new HandledGroups(creation.value, support.value)
  }
}
