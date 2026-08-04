import { RoleNames } from '@enum/RoleNames'
import {
  Contribution as DbContribution,
  CreationGroup as DbCreationGroup,
  UserRole as DbUserRole,
} from 'database'
import { In } from 'typeorm'
import { LogError } from '@/server/LogError'
import {
  buildModeratorScopePredicate,
  parseModeratorScope,
  UNTAGGED_FILTER,
} from './findContributions'

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

export const describeModeratorCreationGroups = (
  role?: DbUserRole | null,
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
    const canonical = await DbCreationGroup.find({ where: { tag: In(realTags) } })
    // creation_groups.tag is utf8mb4_unicode_ci, so the lookup matched regardless of case.
    // Compare on the folded spelling, or "Feuerwehr" would be rejected as unknown while
    // the database just returned "feuerwehr".
    const known = new Map(canonical.map((tag) => [tag.tag.toLowerCase(), tag.tag]))
    const unknown = realTags.filter((tag) => !known.has(tag.toLowerCase()))
    if (unknown.length > 0) {
      throw new LogError('Unknown creation group(s)', unknown.join(', '))
    }
    // Store the canonical spelling, not what the caller typed: the predicate and the
    // rename both compare these strings exactly.
    stored = normalised.map((token) =>
      token.startsWith('*') ? token : (known.get(token.toLowerCase()) ?? token),
    )
  }
  role.visibleCreationGroups = stored.length > 0 ? JSON.stringify(stored) : null
  await role.save()
  return stored
}
