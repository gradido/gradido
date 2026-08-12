import { AppDatabase, CreationGroup as DbCreationGroup, UserRole as DbUserRole } from 'database'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { type EntityManager, Like } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { CreationGroup } from '@/graphql/model/CreationGroup'
import { LegacyHashtagCounts } from '@/graphql/model/LegacyHashtagCounts'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import {
  creationGroupsInCommunityWindow,
  creationGroupsInUserContributions,
} from './util/contributions'
import { parseModeratorScope } from './util/findContributions'
import { adoptLegacyHashtags, countLegacyHashtags } from './util/legacyHashtagAdoption'

const db = AppDatabase.getInstance()

// Normalise a slug into the form it is stored in: strip a leading '#' and trim. Rejected
// are the empty string, inner whitespace (the classic "# Gruppe" error) and a leading '*'
// -- '*' opens the reserved tokens '*all' and '*untagged', which the moderator scope and
// the group filter read as "everything" and "no group". A real group carrying one of those
// names would quietly take over that meaning.
const normaliseTag = (tag: string): string => {
  const normalised = tag.trim().replace(/^#+/, '')
  if (normalised.length === 0 || /\s/.test(normalised) || normalised.startsWith('*')) {
    throw new LogError('Invalid creation group', tag)
  }
  return normalised
}

// Group functions: the canonical, admin-managed list of valid creation groups.
// Tags are stored WITHOUT the leading '#'. This list feeds submission autocomplete,
// the personal per-user tag lists and the moderator visibility scope.
@Resolver(() => CreationGroup)
export class CreationGroupResolver {
  @Authorized([RIGHTS.LIST_CREATION_GROUPS])
  @Query(() => [CreationGroup])
  async creationGroups(): Promise<CreationGroup[]> {
    const tags = await DbCreationGroup.find({ order: { tag: 'ASC' } })
    return tags.map((tag) => new CreationGroup(tag))
  }

  // The groups the community list currently has something to show for. Only the filter
  // above that list uses this — it should offer exactly what can be found behind it, and a
  // group that has been quiet longer than the window would otherwise lead into an empty
  // result and read as "nothing going on here".
  //
  // ⚠️ Do NOT reach for this in the submission field: a group missing there could never be
  // woken up, because nobody could file a contribution for it. That field asks creationGroups,
  // and it must keep doing so.
  @Authorized([RIGHTS.LIST_CREATION_GROUPS])
  @Query(() => [CreationGroup])
  async communityCreationGroups(): Promise<CreationGroup[]> {
    const tags = await DbCreationGroup.find({ order: { tag: 'ASC' } })
    const visible = new Set(await creationGroupsInCommunityWindow(tags.map((tag) => tag.tag)))
    return tags.filter((tag) => visible.has(tag.tag)).map((tag) => new CreationGroup(tag))
  }

  // The groups the caller's own "my contributions" list has something to show for. Like
  // communityCreationGroups, but for the user's own list: it is NOT windowed and it counts their
  // deleted contributions too, because that list shows them. Same reason as above — the
  // filter should offer exactly what can be found behind it, not a group that comes back
  // empty. The submission field must keep asking creationGroups, so a group the caller has never
  // filed in stays choosable there.
  @Authorized([RIGHTS.LIST_CREATION_GROUPS])
  @Query(() => [CreationGroup])
  async myContributionCreationGroups(@Ctx() context: Context): Promise<CreationGroup[]> {
    const user = getUser(context)
    const tags = await DbCreationGroup.find({ order: { tag: 'ASC' } })
    const present = new Set(
      await creationGroupsInUserContributions(
        user.id,
        tags.map((tag) => tag.tag),
      ),
    )
    return tags.filter((tag) => present.has(tag.tag)).map((tag) => new CreationGroup(tag))
  }

  @Authorized([RIGHTS.MANAGE_CREATION_GROUPS])
  @Mutation(() => CreationGroup)
  async addCreationGroup(
    @Arg('tag', () => String) tag: string,
    @Arg('name', () => String, { nullable: true }) name?: string | null,
  ): Promise<CreationGroup> {
    const normalised = normaliseTag(tag)
    const existing = await DbCreationGroup.findOne({ where: { tag: normalised } })
    if (existing) {
      throw new LogError('Creation group already exists', normalised)
    }
    const entry = DbCreationGroup.create()
    entry.tag = normalised
    entry.name = name?.trim() ? name.trim() : null
    await DbCreationGroup.save(entry)
    return new CreationGroup(entry)
  }

  // Edit an existing group: rename the display name and/or the canonical slug.
  // The important links — which contributions carry the tag, and each user's personal
  // tag list — reference the numeric id, so they survive a rename untouched. The only
  // string-based reference, the moderator visibility scope, is migrated in lock-step.
  // Deleting is intentionally not offered (a tag in use must not vanish silently).
  @Authorized([RIGHTS.MANAGE_CREATION_GROUPS])
  @Mutation(() => CreationGroup)
  async editCreationGroup(
    @Arg('id', () => Int) id: number,
    @Arg('tag', () => String, { nullable: true }) tag?: string | null,
    @Arg('name', () => String, { nullable: true }) name?: string | null,
  ): Promise<CreationGroup> {
    const entry = await DbCreationGroup.findOne({ where: { id } })
    if (!entry) {
      throw new LogError('Creation group not found', id)
    }
    let renamedFrom: string | null = null
    if (tag !== undefined && tag !== null) {
      const normalised = normaliseTag(tag)
      if (normalised !== entry.tag) {
        // ⚠️ A group cannot clash with itself. The lookup runs on a utf8mb4_unicode_ci
        // column, so it is case- AND accent-insensitive: searching for "Monchengladbach"
        // returns the group already called "Mönchengladbach". Without the id check that
        // read as "creation group already exists", which was both wrong and misleading -- it
        // made every purely cosmetic respelling impossible ("feuerwehr" -> "Feuerwehr",
        // "Munchen" -> "München").
        const clash = await DbCreationGroup.findOne({ where: { tag: normalised } })
        if (clash && clash.id !== entry.id) {
          throw new LogError('Creation group already exists', normalised)
        }
        renamedFrom = entry.tag
        entry.tag = normalised
      }
    }
    if (name !== undefined) {
      entry.name = name?.trim() ? name.trim() : null
    }
    // ⚠️ One transaction, and this is the one that matters most in the feature. The slug and
    // the moderator scopes that quote it have to move together: the scope predicate compares
    // the tag EXACTLY, so a scope still holding the old spelling matches nothing. A moderator
    // it happens to would find their contribution list empty and every action on the
    // contributions they own refused -- silently, with nothing on screen to say why.
    //
    // ⚠️ And there would be no second chance. Repeating the edit does not repair it: a second
    // call with the same tag stops at `normalised !== entry.tag`, so renamedFrom stays null
    // and the scopes are never revisited. Committing the two separately meant a failure in
    // between could only be undone by hand, in SQL.
    await db.getDataSource().transaction(async (trx: EntityManager) => {
      await trx.save(entry)
      if (renamedFrom !== null) {
        await this.renameTagInModeratorScopes(renamedFrom, entry.tag, trx)
      }
    })
    return new CreationGroup(entry)
  }

  // What adopting the legacy hashtags would find for this group right now. Reads memos, so
  // it runs only when an administrator opens the panel -- never on a list render.
  @Authorized([RIGHTS.ADOPT_LEGACY_HASHTAGS])
  @Query(() => LegacyHashtagCounts)
  async legacyHashtagCounts(@Arg('id', () => Int) id: number): Promise<LegacyHashtagCounts> {
    const entry = await DbCreationGroup.findOne({ where: { id } })
    if (!entry) {
      throw new LogError('Creation group not found', id)
    }
    const counts = await countLegacyHashtags(entry.tag)
    return new LegacyHashtagCounts(counts.exact, counts.loose)
  }

  // Link the contributions whose memo names this group into it, once and on purpose.
  //
  // Returns the group so the caller sees the new state without asking again. The timestamp
  // is written even when nothing was found: that is how "I looked, there was nothing" is
  // told apart from "nobody has looked yet", and without it a group with nothing to adopt
  // would keep asking to be checked forever.
  @Authorized([RIGHTS.ADOPT_LEGACY_HASHTAGS])
  @Mutation(() => CreationGroup)
  async adoptLegacyHashtags(
    @Arg('id', () => Int) id: number,
    @Arg('includeLoose', () => Boolean) includeLoose: boolean,
  ): Promise<CreationGroup> {
    const entry = await DbCreationGroup.findOne({ where: { id } })
    if (!entry) {
      throw new LogError('Creation group not found', id)
    }
    const adopted = await adoptLegacyHashtags(entry.id, entry.tag, includeLoose)
    entry.hashtagsAdoptedAt = new Date()
    // The count of THIS run, not a running total: it answers "what did the last look do?".
    // A second run after ticking the loose spelling reports what that second look added.
    entry.hashtagsAdoptedCount = adopted
    await DbCreationGroup.save(entry)
    return new CreationGroup(entry)
  }

  // Migrate a renamed slug through the moderator scopes stored as JSON tag-string arrays
  // on user_roles.visible_creation_groups. Bounded to the few roles that carry the old tag;
  // the sentinels '*all'/'*untagged' and every other tag are left as they are.
  // ⚠️ Runs on the caller's entity manager, never on the global connection: it is one half of
  // the rename and has to roll back with the other half if anything fails.
  private async renameTagInModeratorScopes(
    oldTag: string,
    newTag: string,
    trx: EntityManager,
  ): Promise<void> {
    const roles = await trx.find(DbUserRole, {
      where: { visibleCreationGroups: Like(`%${oldTag}%`) },
    })
    const changed: DbUserRole[] = []
    for (const role of roles) {
      const scope = parseModeratorScope(role.visibleCreationGroups)
      // The LIKE over-matches on purpose -- it cannot do better on a text column -- so
      // renaming "feuerwehr" also pulls in a role scoped to "feuerwehr-nord". The exact
      // comparison here is what keeps that one untouched.
      if (!scope || !scope.includes(oldTag)) {
        continue
      }
      role.visibleCreationGroups = JSON.stringify(
        scope.map((token) => (token === oldTag ? newTag : token)),
      )
      changed.push(role)
    }
    if (changed.length > 0) {
      await trx.save(changed)
    }
  }
}
