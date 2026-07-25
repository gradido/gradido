import { GroupTag as DbGroupTag, UserRole as DbUserRole } from 'database'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { Like } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { GroupTag } from '@/graphql/model/GroupTag'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { groupTagsInCommunityWindow, groupTagsInUserContributions } from './util/contributions'
import { parseModeratorScope } from './util/findContributions'

// Normalise a slug into the form it is stored in: strip a leading '#' and trim. Rejected
// are the empty string, inner whitespace (the classic "# Gruppe" error) and a leading '*'
// -- '*' opens the reserved tokens '*all' and '*untagged', which the moderator scope and
// the group filter read as "everything" and "no group". A real group carrying one of those
// names would quietly take over that meaning.
const normaliseTag = (tag: string): string => {
  const normalised = tag.trim().replace(/^#+/, '')
  if (normalised.length === 0 || /\s/.test(normalised) || normalised.startsWith('*')) {
    throw new LogError('Invalid group tag', tag)
  }
  return normalised
}

// Group functions: the canonical, admin-managed list of valid group tags.
// Tags are stored WITHOUT the leading '#'. This list feeds submission autocomplete,
// the personal per-user tag lists and the moderator visibility scope.
@Resolver(() => GroupTag)
export class GroupTagResolver {
  @Authorized([RIGHTS.LIST_GROUP_TAGS])
  @Query(() => [GroupTag])
  async groupTags(): Promise<GroupTag[]> {
    const tags = await DbGroupTag.find({ order: { tag: 'ASC' } })
    return tags.map((tag) => new GroupTag(tag))
  }

  // The groups the community list currently has something to show for. Only the filter
  // above that list uses this — it should offer exactly what can be found behind it, and a
  // group that has been quiet longer than the window would otherwise lead into an empty
  // result and read as "nothing going on here".
  //
  // ⚠️ Do NOT reach for this in the submission field: a group missing there could never be
  // woken up, because nobody could file a contribution for it. That field asks groupTags,
  // and it must keep doing so.
  @Authorized([RIGHTS.LIST_GROUP_TAGS])
  @Query(() => [GroupTag])
  async communityGroupTags(): Promise<GroupTag[]> {
    const tags = await DbGroupTag.find({ order: { tag: 'ASC' } })
    const visible = new Set(await groupTagsInCommunityWindow(tags.map((tag) => tag.tag)))
    return tags.filter((tag) => visible.has(tag.tag)).map((tag) => new GroupTag(tag))
  }

  // The groups the caller's own "my contributions" list has something to show for. Like
  // communityGroupTags, but for the user's own list: it is NOT windowed and it counts their
  // deleted contributions too, because that list shows them. Same reason as above — the
  // filter should offer exactly what can be found behind it, not a group that comes back
  // empty. The submission field must keep asking groupTags, so a group the caller has never
  // filed in stays choosable there.
  @Authorized([RIGHTS.LIST_GROUP_TAGS])
  @Query(() => [GroupTag])
  async myContributionGroupTags(@Ctx() context: Context): Promise<GroupTag[]> {
    const user = getUser(context)
    const tags = await DbGroupTag.find({ order: { tag: 'ASC' } })
    const present = new Set(
      await groupTagsInUserContributions(
        user.id,
        tags.map((tag) => tag.tag),
      ),
    )
    return tags.filter((tag) => present.has(tag.tag)).map((tag) => new GroupTag(tag))
  }

  @Authorized([RIGHTS.MANAGE_GROUP_TAGS])
  @Mutation(() => GroupTag)
  async createGroupTag(
    @Arg('tag', () => String) tag: string,
    @Arg('name', () => String, { nullable: true }) name?: string | null,
  ): Promise<GroupTag> {
    const normalised = normaliseTag(tag)
    const existing = await DbGroupTag.findOne({ where: { tag: normalised } })
    if (existing) {
      throw new LogError('Group tag already exists', normalised)
    }
    const entry = DbGroupTag.create()
    entry.tag = normalised
    entry.name = name?.trim() ? name.trim() : null
    await DbGroupTag.save(entry)
    return new GroupTag(entry)
  }

  // Edit an existing group: rename the display name and/or the canonical slug.
  // The important links — which contributions carry the tag, and each user's personal
  // tag list — reference the numeric id, so they survive a rename untouched. The only
  // string-based reference, the moderator visibility scope, is migrated in lock-step.
  // Deleting is intentionally not offered (a tag in use must not vanish silently).
  @Authorized([RIGHTS.MANAGE_GROUP_TAGS])
  @Mutation(() => GroupTag)
  async updateGroupTag(
    @Arg('id', () => Int) id: number,
    @Arg('tag', () => String, { nullable: true }) tag?: string | null,
    @Arg('name', () => String, { nullable: true }) name?: string | null,
  ): Promise<GroupTag> {
    const entry = await DbGroupTag.findOne({ where: { id } })
    if (!entry) {
      throw new LogError('Group tag not found', id)
    }
    let renamedFrom: string | null = null
    if (tag !== undefined && tag !== null) {
      const normalised = normaliseTag(tag)
      if (normalised !== entry.tag) {
        const clash = await DbGroupTag.findOne({ where: { tag: normalised } })
        if (clash) {
          throw new LogError('Group tag already exists', normalised)
        }
        renamedFrom = entry.tag
        entry.tag = normalised
      }
    }
    if (name !== undefined) {
      entry.name = name?.trim() ? name.trim() : null
    }
    await DbGroupTag.save(entry)
    if (renamedFrom !== null) {
      await this.renameTagInModeratorScopes(renamedFrom, entry.tag)
    }
    return new GroupTag(entry)
  }

  // Migrate a renamed slug through the moderator scopes stored as JSON tag-string arrays
  // on user_roles.visible_group_tags. Bounded to the few roles that carry the old tag;
  // the sentinels '*all'/'*untagged' and every other tag are left as they are.
  private async renameTagInModeratorScopes(oldTag: string, newTag: string): Promise<void> {
    const roles = await DbUserRole.find({ where: { visibleGroupTags: Like(`%${oldTag}%`) } })
    for (const role of roles) {
      const scope = parseModeratorScope(role.visibleGroupTags)
      if (!scope || !scope.includes(oldTag)) {
        continue
      }
      role.visibleGroupTags = JSON.stringify(
        scope.map((token) => (token === oldTag ? newTag : token)),
      )
      await role.save()
    }
  }
}
