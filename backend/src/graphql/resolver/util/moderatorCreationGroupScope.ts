import { Paginated } from '@arg/Paginated'
import { SearchContributionsFilterArgs } from '@arg/SearchContributionsFilterArgs'
import { ContributionStatus } from '@enum/ContributionStatus'
import { RoleNames } from '@enum/RoleNames'
import { Contribution as DbContribution, UserRole as DbUserRole } from 'database'
import { handledCreationGroupsOf } from '@/data/HandledCreationGroups.logic'
import type { HandledCreationGroups } from '@/data/HandledCreationGroups.schema'
import { LogError } from '@/server/LogError'
import {
  buildModeratorScopePredicate,
  findContributions,
  HANDLED_FILTER,
  parseModeratorScope,
  UNTAGGED_FILTER,
} from './findContributions'
import { resolveCreationGroups } from './resolveCreationGroups'

// Both moderator kinds are scoped alike: a MODERATOR_AI is a moderator who may additionally
// use Crea — not a wider role. Every visibility-scope check goes through this helper, so a
// moderator-like role cannot silently slip past the scope. Admins stay unrestricted.
export const isScopedModeratorRole = (role?: string | null): boolean =>
  role === RoleNames.MODERATOR || role === RoleNames.MODERATOR_AI

// The visibility scope is a real access boundary, not merely a list filter: a scoped
// moderator may only act on contributions their scope covers. This gates the action being
// attempted NOW — anything they did earlier stays untouched in the record, it just cannot
// be continued once the group is taken away. Matching runs through the very same predicate
// as the contribution list, so view and action can never disagree.
export const assertContributionInModeratorScope = async (
  contributionId: number,
  role?: DbUserRole | null,
): Promise<void> => {
  if (!role || !isScopedModeratorRole(role.role)) {
    return
  }
  const scope = parseModeratorScope(role.visibleCreationGroups)
  if (!scope) {
    return
  }
  const predicate = buildModeratorScopePredicate(scope)
  if (!predicate) {
    return
  }
  const inScope = await DbContribution.createQueryBuilder('Contribution')
    // A deleted contribution still belongs to its group. Without this the guard would
    // refuse every soft-deleted row, and a scoped moderator could not open the history of
    // one of their own group's deleted contributions.
    .withDeleted()
    .where('Contribution.id = :contributionId', { contributionId })
    .andWhere(predicate.sql, predicate.params)
    .getCount()
  if (inScope === 0) {
    throw new LogError('Contribution is outside the moderator group scope', contributionId)
  }
}

// Group functions: a moderator's visibility scope, stored as a JSON array on
// user_roles.visible_creation_groups. Values are canonical creation groups plus the reserved
// sentinels '*all' (see everything) and '*untagged' (contributions without a tag).
const SCOPE_SENTINELS = ['*all', '*untagged']

// How a user's groups read on the community info page: which groups they moderate, and
// whether they are unrestricted. An empty scope, a missing scope and the '*all' sentinel
// all mean "no restriction" — the very reading the contribution list uses — so a moderator
// nobody has assigned yet is shown as covering everything instead of covering nothing.
// Roles that are not scoped at all (admins) are unrestricted by definition.
export interface ModeratorCreationGroups {
  tags: string[]
  seesAllCreationGroups: boolean
  seesUntagged: boolean
}

// Only these two fields are read, so a row of any query will do: the mail about a support
// request reads the moderators through Drizzle (supportTicketModeratorsMail.ts).
export const describeModeratorCreationGroups = (
  role?: Pick<DbUserRole, 'role' | 'visibleCreationGroups'> | null,
): ModeratorCreationGroups => {
  if (!role || !isScopedModeratorRole(role.role)) {
    return { tags: [], seesAllCreationGroups: true, seesUntagged: true }
  }
  const scope = parseModeratorScope(role.visibleCreationGroups)
  // An empty array reads the same as a missing one: the contribution list applies no
  // predicate for it, so the description has to say "unrestricted" too, or the admin would
  // show a cage the backend does not enforce.
  if (!scope || scope.length === 0 || scope.includes('*all')) {
    return { tags: [], seesAllCreationGroups: true, seesUntagged: true }
  }
  const tags = scope.filter((tag) => tag.length > 0 && !tag.startsWith('*'))
  // '*untagged' is stripped from the tag list — it is not a group — but whether it is part
  // of the scope has to survive, or the admin cannot offer a filter that reaches the
  // ungrouped contributions this moderator is assigned to.
  // Only sentinels left (in practice just '*untagged'): a real, narrow assignment, not a
  // free pass — the page lists these moderators under their own heading.
  return { tags, seesAllCreationGroups: false, seesUntagged: scope.includes(UNTAGGED_FILTER) }
}

// "Meine Gruppen" of the creations of the role a request loaded: the choice of one who sees every
// group, else null (handledCreationGroupsOf). The one reading for the creation page, its counts, the
// number of contributions at "Admin" in the wallet and the choice's own query (MG1, MG3), so that
// they cannot answer differently.
export const handledCreationGroupsOfRole = (
  role?: Pick<DbUserRole, 'role' | 'visibleCreationGroups' | 'handledCreationGroups'> | null,
): HandledCreationGroups | null =>
  handledCreationGroupsOf(
    role?.handledCreationGroups,
    describeModeratorCreationGroups(role).seesAllCreationGroups,
  )

// "Meine Gruppen" of the support (MG2b): the same rule over the support's own column. The one
// reading for the support's list and count, the number of requests at "Admin" in the wallet and the
// choice's own query.
export const handledSupportGroupsOfRole = (
  role?: Pick<DbUserRole, 'role' | 'visibleCreationGroups' | 'handledSupportGroups'> | null,
): HandledCreationGroups | null =>
  handledCreationGroupsOf(
    role?.handledSupportGroups,
    describeModeratorCreationGroups(role).seesAllCreationGroups,
  )

// The groups a role's contribution lists are held to: a scoped moderator's scope, else null --
// what adminListContributions hands findContributions.
export const moderatorScopeOfRole = (
  role?: Pick<DbUserRole, 'role' | 'visibleCreationGroups'> | null,
): string[] | null =>
  role && isScopedModeratorRole(role.role) ? parseModeratorScope(role.visibleCreationGroups) : null

// What waits for the moderation in "Meine Gruppen" of the role (MG3): the count of the line
// "n warten auf die Moderation" on the admin's start page, `waitingForModeration` of
// adminOpenCreationCounts -- the filter, the scope and the choice adminListContributions hands
// findContributions for it, in one place. Not its relations: it joins the member and the address
// because its empty search word counts as one, and a left join changes no COUNT(DISTINCT id).
export const countContributionsWaitingForModeration = async (
  role?: Pick<DbUserRole, 'role' | 'visibleCreationGroups' | 'handledCreationGroups'> | null,
): Promise<number> => {
  const filter = Object.assign(new SearchContributionsFilterArgs(), {
    statusFilter: [ContributionStatus.PENDING],
    hideResubmission: true,
    creationGroup: HANDLED_FILTER,
  })
  const [, count] = await findContributions(
    new Paginated(),
    filter,
    true,
    undefined,
    true,
    moderatorScopeOfRole(role),
    handledCreationGroupsOfRole(role),
  )
  return count
}

export const loadModeratorScope = async (userId: number): Promise<string[]> => {
  const role = await DbUserRole.findOne({ where: { userId } })
  return parseModeratorScope(role?.visibleCreationGroups ?? null) ?? []
}

export const saveModeratorScope = async (userId: number, scope: string[]): Promise<string[]> => {
  const role = await DbUserRole.findOne({ where: { userId } })
  if (!role) {
    throw new LogError('User has no role to scope', userId)
  }
  const seen = new Set<string>()
  const normalised: string[] = []
  for (const raw of scope) {
    const value = raw.trim()
    if (value.length === 0) {
      continue
    }
    const token = SCOPE_SENTINELS.includes(value) ? value : value.replace(/^#+/, '')
    if (!seen.has(token)) {
      seen.add(token)
      normalised.push(token)
    }
  }
  const badSentinels = normalised.filter(
    (token) => token.startsWith('*') && !SCOPE_SENTINELS.includes(token),
  )
  if (badSentinels.length > 0) {
    throw new LogError('Unknown scope value(s)', badSentinels.join(', '))
  }
  const realTags = normalised.filter((token) => !token.startsWith('*'))
  let stored = normalised
  if (realTags.length > 0) {
    // The database decides which spellings mean the same group -- see resolveCreationGroups.
    const known = await resolveCreationGroups(realTags)
    const unknown = realTags.filter((tag) => !known.has(tag))
    if (unknown.length > 0) {
      throw new LogError('Unknown creation group(s)', unknown.join(', '))
    }
    // Store the canonical spelling, not what the caller typed: the predicate and the
    // rename both compare these strings exactly.
    //
    // ⚠️ And collapse again afterwards. The Set above ran on what the caller typed and is
    // case-sensitive, while creation_groups.tag is utf8mb4_unicode_ci -- so "feuerwehr" and
    // "Feuerwehr" both survive it and then fold into the same canonical spelling here. Left
    // alone, the scope would carry the same group twice: harmless to the predicate, but the
    // admin lists it twice and it is stored that way for good.
    const canonicalised = normalised.map((token) =>
      token.startsWith('*') ? token : (known.get(token)?.tag ?? token),
    )
    stored = [...new Set(canonicalised)]
  }
  role.visibleCreationGroups = stored.length > 0 ? JSON.stringify(stored) : null
  await role.save()
  return stored
}
