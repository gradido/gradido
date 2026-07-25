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

// True when a contribution's group was never set through the group field: no structured
// link and no group_tags_set_at stamp. Only then does a legacy inline "#tag" in the memo
// still count — see below.
const NO_ASSIGNMENT_SQL =
  `(Contribution.group_tags_set_at IS NULL ` +
  `AND NOT EXISTS (SELECT 1 FROM contribution_group_tags cgt ` +
  `WHERE cgt.contribution_id = Contribution.id))`

// A contribution "carries" tag T if it has a structured contribution_group_tags entry for
// T — or, only where no assignment was ever made, a legacy inline "#T" in its memo.
//
// The inline fallback is deliberately subordinate rather than an equal alternative: a
// hashtag written for other reasons ("#feuerwehr was great!") must not pull an assigned
// contribution into a foreign group — neither into that group's search results nor into
// its moderator's visibility scope, which is a real access boundary. Once the group field
// has spoken, hashtags in the memo are ordinary text.
const tagMatchSql = (key: string): string =>
  `(EXISTS (SELECT 1 FROM contribution_group_tags cgt ` +
  `INNER JOIN group_tags gt ON gt.id = cgt.group_tag_id ` +
  `WHERE cgt.contribution_id = Contribution.id AND gt.tag = :${key}) ` +
  `OR (${NO_ASSIGNMENT_SQL} AND Contribution.memo LIKE :${key}Like))`

// The one token that stands for "belongs to no group". Used by the moderator scope and by
// the group filter, so both mean exactly the same set of contributions.
export const UNTAGGED_FILTER = '*untagged'

// Its complement, offered by the group filter only: everything that does belong to some
// group. "all" (the empty filter) plus these two cover every contribution exactly once.
export const GROUPED_FILTER = '*grouped'

// "Untagged" = no group moderator is looking after this. That means no structured tag,
// and — only where nothing was ever assigned — no inline hashtag naming a group that
// actually exists. A contribution deliberately set to "no group" is untagged whatever its
// memo contains.
//
// The inline half asks the canonical list rather than just looking for a '#': a "#thanks"
// in old stock names no group, so nobody moderates it by that hashtag and it belongs here.
// Testing for any '#' at all would drop those contributions out of both lists — no group
// moderator sees them, and the one working through the ungrouped ones would not either.
//
// The COLLATE is required, not cosmetic: contributions.memo is utf8mb4_general_ci while
// group_tags.tag is utf8mb4_unicode_ci, and comparing two columns of different collations
// is an error (ER_CANT_AGGREGATE_2COLLATIONS). Matching a tag against a bound string does
// not hit this, which is why the comparisons elsewhere need nothing. utf8mb4_unicode_ci is
// the right side to land on: it is what the canonical list is compared with everywhere
// else, case- and accent-insensitive.
const UNTAGGED_SQL =
  `(NOT EXISTS (SELECT 1 FROM contribution_group_tags cgt ` +
  `WHERE cgt.contribution_id = Contribution.id) ` +
  `AND (Contribution.group_tags_set_at IS NOT NULL ` +
  `OR NOT EXISTS (SELECT 1 FROM group_tags gt ` +
  `WHERE Contribution.memo COLLATE utf8mb4_unicode_ci ` +
  `LIKE CONCAT('%#', gt.tag, '%'))))`

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
    params[`${key}Like`] = `%#${tag}%`
  })
  if (includeUntagged) {
    parts.push(UNTAGGED_SQL)
  }
  return { sql: `(${parts.join(' OR ')})`, params }
}

// A single group filter, as picked from the dropdown in the admin or in the wallet. Matched
// the same way the list does: a structured link OR a legacy inline "#tag". Two reserved
// tokens stand beside the real groups: '*untagged' selects the contributions no group
// moderator is looking after, '*grouped' their complement. A real slug can never collide
// with either: '*' is rejected when a group is created or renamed.
export const buildGroupTagPredicate = (
  tag: string,
): { sql: string; params: Record<string, string> } => {
  if (tag === UNTAGGED_FILTER) {
    return { sql: UNTAGGED_SQL, params: {} }
  }
  if (tag === GROUPED_FILTER) {
    return { sql: `(NOT ${UNTAGGED_SQL})`, params: {} }
  }
  return {
    sql: tagMatchSql('groupTagFilter'),
    params: { groupTagFilter: tag, groupTagFilterLike: `%#${tag}%` },
  }
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
