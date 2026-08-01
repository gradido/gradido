import { Paginated } from '@arg/Paginated'
import { SearchContributionsFilterArgs } from '@arg/SearchContributionsFilterArgs'
import { AppDatabase, Contribution as DbContribution } from 'database'
import { Brackets, In, IsNull, LessThanOrEqual, Like, SelectQueryBuilder } from 'typeorm'

import { LogError } from '@/server/LogError'

interface Relations {
  [key: string]: boolean | Relations
}

function joinRelationsRecursive(
  relations: Relations,
  queryBuilder: SelectQueryBuilder<DbContribution>,
  currentPath: string,
): void {
  for (const key in relations) {
    queryBuilder.leftJoinAndSelect(`${currentPath}.${key}`, key)
    if (typeof relations[key] === 'object') {
      // If it's a nested relation
      joinRelationsRecursive(relations[key] as Relations, queryBuilder, key)
    }
  }
}

// --- Group functions: group-tag filter + moderator visibility scope ---

// A contribution "carries" tag T if it is linked to T. Nothing else — the memo is not
// consulted. The inline "#tag" convention that predates the group field is no longer
// resolved on read; that stock is adopted into real links per group, from the admin.
//
// Both this and UNTAGGED_SQL are served by idx_cgt_contribution_id, so they stay cheap on a
// large table. That is the point of reading links only: the previous version compared the
// memo against every group with a leading-wildcard LIKE, which no index can help with.
const tagMatchSql = (key: string): string =>
  `EXISTS (SELECT 1 FROM contribution_group_tags cgt ` +
  `INNER JOIN group_tags gt ON gt.id = cgt.group_tag_id ` +
  `WHERE cgt.contribution_id = Contribution.id AND gt.tag = :${key})`

// The one token that stands for "belongs to no group". Used by the moderator scope and by
// the group filter, so both mean exactly the same set of contributions.
export const UNTAGGED_FILTER = '*untagged'

// Its complement, offered by the group filter only: everything that does belong to some
// group. "all" (the empty filter) plus these two cover every contribution exactly once.
export const GROUPED_FILTER = '*grouped'

// "Untagged" = no group moderator is looking after this: the contribution is linked to no
// group. Exactly the complement of "linked to some group", so "all" plus these two cover
// every contribution once.
const UNTAGGED_SQL =
  `NOT EXISTS (SELECT 1 FROM contribution_group_tags cgt ` +
  `WHERE cgt.contribution_id = Contribution.id)`

// Parse a moderator's stored scope (JSON text on user_roles.visible_group_tags) into a
// string array. null (= no restriction) for empty/invalid input.
export const parseModeratorScope = (raw: string | null | undefined): string[] | null => {
  if (!raw) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch {
    return null
  }
}

// Build the SQL predicate for a moderator scope, or null when the scope imposes no
// restriction ('*all', or nothing selectable at all). Shared by the contribution list and
// the per-contribution action guard, so the two can never drift apart.
export const buildModeratorScopePredicate = (
  moderatorScope: string[],
): { sql: string; params: Record<string, string> } | null => {
  if (moderatorScope.includes('*all')) {
    return null
  }
  const realTags = moderatorScope.filter((tag) => tag.length > 0 && !tag.startsWith('*'))
  const includeUntagged = moderatorScope.includes(UNTAGGED_FILTER)
  if (realTags.length === 0 && !includeUntagged) {
    return null
  }
  const parts: string[] = []
  const params: Record<string, string> = {}
  realTags.forEach((tag, index) => {
    const key = `scopeTag${index}`
    parts.push(tagMatchSql(key))
    params[key] = tag
  })
  if (includeUntagged) {
    parts.push(UNTAGGED_SQL)
  }
  return { sql: `(${parts.join(' OR ')})`, params }
}

// A single group filter, as picked from the dropdown in the admin or in the wallet. Two
// reserved tokens stand beside the real groups: '*untagged' selects the contributions no
// group moderator is looking after, '*grouped' their complement. A real slug can never
// collide with either: '*' is rejected when a group is created or renamed.
export const buildGroupTagPredicate = (
  tag: string,
): { sql: string; params: Record<string, string> } => {
  if (tag === UNTAGGED_FILTER) {
    return { sql: UNTAGGED_SQL, params: {} }
  }
  if (tag === GROUPED_FILTER) {
    return { sql: `(NOT ${UNTAGGED_SQL})`, params: {} }
  }
  return { sql: tagMatchSql('groupTagFilter'), params: { groupTagFilter: tag } }
}

export const findContributions = async (
  { pageSize, currentPage, order }: Paginated,
  filter: SearchContributionsFilterArgs,
  withDeleted = false,
  relations: Relations | undefined = undefined,
  countOnly = false,
  moderatorScope: string[] | null = null,
): Promise<[DbContribution[], number]> => {
  const connection = AppDatabase.getInstance()
  if (!connection.isConnected()) {
    throw new LogError('Cannot connect to db')
  }
  const queryBuilder = connection
    .getDataSource()
    .getRepository(DbContribution)
    .createQueryBuilder('Contribution')
  if (relations) {
    joinRelationsRecursive(relations, queryBuilder, 'Contribution')
  }
  if (withDeleted) {
    queryBuilder.withDeleted()
  }
  queryBuilder.where({
    ...(filter.statusFilter?.length && { contributionStatus: In(filter.statusFilter) }),
    ...(filter.userId && { userId: filter.userId }),
  })
  if (filter.hideResubmission) {
    const now = new Date(new Date().toUTCString())
    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where({ resubmissionAt: IsNull() }).orWhere({ resubmissionAt: LessThanOrEqual(now) })
      }),
    )
  }
  queryBuilder.printSql()
  if (filter.query) {
    const queryString = '%' + filter.query + '%'
    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where({ memo: Like(queryString) })
        if (relations?.user) {
          qb.orWhere('user.first_name LIKE :firstName', { firstName: queryString })
            .orWhere('user.last_name LIKE :lastName', { lastName: queryString })
            .orWhere('user.alias LIKE :alias', { alias: queryString })
            .orWhere("LOWER(CONCAT(user.first_name, ' ', user.last_name)) LIKE LOWER(:fullName)", {
              fullName: queryString.toLowerCase(),
            })
            .orWhere('emailContact.email LIKE :emailContact', { emailContact: queryString })
            .orWhere({ memo: Like(queryString) })
        }
      }),
    )
  }
  // Group-tag filter from the admin UI (a single selected group). Separate from the
  // free-text `query` above, so both can be applied at the same time.
  if (filter.groupTag) {
    const groupPredicate = buildGroupTagPredicate(filter.groupTag)
    queryBuilder.andWhere(groupPredicate.sql, groupPredicate.params)
  }
  // Hard moderator visibility scope: a group moderator only sees the contributions of the
  // tags they are authorised for. null / '*all' = no restriction (existing moderators keep
  // full visibility); '*untagged' = contributions without any tag.
  if (moderatorScope) {
    const scopePredicate = buildModeratorScopePredicate(moderatorScope)
    if (scopePredicate) {
      queryBuilder.andWhere(scopePredicate.sql, scopePredicate.params)
    }
  }
  if (countOnly) {
    return [[], await queryBuilder.getCount()]
  }
  return queryBuilder
    .orderBy('Contribution.createdAt', order)
    .addOrderBy('Contribution.id', order)
    .skip((currentPage - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount()
}
