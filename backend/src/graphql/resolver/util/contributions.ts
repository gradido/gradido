import { ContributionFilterArgs } from '@arg/ContributionFilterArgs'
import { Paginated } from '@arg/Paginated'
import { Contribution as DbContribution } from 'database'
import { FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX } from 'shared'
import { In, SelectQueryBuilder } from 'typeorm'
import { CONFIG } from '@/config'
import { Order } from '@/graphql/enum/Order'
import { buildGroupTagPredicate } from './findContributions'

// Data protection: the community list forgets. It shows a recent stretch and nothing
// older, so nobody can read a member's deeds back over years, and a decision that was
// settled long ago stops being on permanent display. Only the display forgets — the
// submitter keeps every contribution in their own list, moderation and the ledger keep the
// full record.
//
// Six months rather than three: the shortest sensible window is three, because a
// contribution may be submitted for the current and the two preceding months (see
// getUserCreations), and moderation oversight needs enough cases in view to tell a
// consistent decision from an arbitrary one — a small group may have two in a quarter.
//
// A fixed value on purpose, not a setting in the admin: whoever is being checked must not
// be able to turn down the evidence they are checked by. Changing it is an ordinary
// delivery, which is more visible than a field somebody edits. The number is served to the
// wallet (see CommunityContributionListResult) so the heading above the list cannot claim
// a window that is not the real one.
export const COMMUNITY_WINDOW_MONTHS = 6

// The window runs on the later of submission and decision, never on the date of the deed:
// a contribution may be filed today for an activity three months back, and anchoring on
// the activity would hide it on the day it was submitted. A contribution decided last week
// stays visible however old the deed is.
//
// GREATEST, not COALESCE alone: a decision date can sit BEFORE the row was created —
// backdated fixtures do it, and so would a data migration or a moderator machine with a
// wrong clock. Taking the decision date whenever there is one would then hide a
// contribution filed today. "Later of the two" is what this window means, so say it.
const COMMUNITY_WINDOW_SQL =
  'GREATEST(Contribution.created_at, COALESCE(Contribution.confirmed_at, Contribution.denied_at, Contribution.created_at)) >= :communityWindowStart'

// Month arithmetic rolls over on month ends (31 August minus 6 months lands in early
// March), which shifts the edge of the window by a day or two. Immaterial at this scale.
const communityWindowStart = (): Date => {
  const start = new Date()
  start.setMonth(start.getMonth() - COMMUNITY_WINDOW_MONTHS)
  return start
}

const applyCommunityWindow = (queryBuilder: SelectQueryBuilder<DbContribution>): void => {
  queryBuilder.andWhere(COMMUNITY_WINDOW_SQL, { communityWindowStart: communityWindowStart() })
}

// Group functions: the wallet's own search. It matches the memo and the group,
// never a person. The community list does not carry the submitter at all (see
// loadAllContributions), so there is nothing here to search people by — neither by name
// nor, as always, by e-mail address.
const applyWalletFilter = (
  queryBuilder: SelectQueryBuilder<DbContribution>,
  filter: ContributionFilterArgs | null | undefined,
): void => {
  if (!filter) {
    return
  }
  const query = filter.query?.trim()
  if (query) {
    queryBuilder.andWhere('Contribution.memo LIKE :walletQuery', { walletQuery: `%${query}%` })
  }
  if (filter.groupTag) {
    const groupPredicate = buildGroupTagPredicate(filter.groupTag)
    queryBuilder.andWhere(groupPredicate.sql, groupPredicate.params)
  }
}

/*
 * Load user contributions with messages
 * @param userId if userId is set, load all contributions of the user, with messages
 * @param paginated pagination, see {@link Paginated}
 * @param filter optional wallet search (text, group)
 */
export const loadUserContributions = async (
  userId: number,
  paginated: Paginated,
  filter?: ContributionFilterArgs | null,
): Promise<[DbContribution[], number]> => {
  const { order, currentPage, pageSize } = paginated
  // Ids first (cheap and filterable), then the full rows with their relations. The two-step
  // shape is kept on purpose — typeorm would otherwise generate one much slower join query.
  // createdAt has to be selected as well: with skip/take typeorm wraps this in a
  // "distinctAlias" subquery that must carry every column we order by.
  const idQuery = DbContribution.createQueryBuilder('Contribution')
    .select(['Contribution.id', 'Contribution.createdAt'])
    .where('Contribution.userId = :userId', { userId })
    .withDeleted()
  applyWalletFilter(idQuery, filter)

  const count = await idQuery.getCount()
  const contributionIds = await idQuery
    .orderBy('Contribution.createdAt', order)
    .addOrderBy('Contribution.id', order)
    .skip((currentPage - 1) * pageSize)
    .take(pageSize)
    .getMany()

  const contributions = await DbContribution.find({
    relations: { messages: { user: true } },
    withDeleted: true,
    order: { createdAt: order, id: order, messages: { createdAt: Order.ASC } },
    where: { id: In(contributionIds.map((contribution) => contribution.id)) },
  })
  return [contributions, count]
}

/*
 * Load all contributions for the community list
 *
 * Data protection: this list is open to every logged-in member, and it shows deeds
 * including the ones a moderator denied. It therefore carries NO person — the submitter is
 * deliberately not loaded, so the field stays empty even for someone querying the API
 * directly. Each contribution is identified by its number instead; only the person
 * themselves can connect a number to a name, and only if they choose to (their own list
 * shows their numbers). Do not add the user relation back here.
 *
 * @param paginated pagination, see {@link Paginated}
 */
export const loadAllContributions = async (
  paginated: Paginated,
  filter?: ContributionFilterArgs | null,
): Promise<[DbContribution[], number]> => {
  const { order, currentPage, pageSize } = paginated
  // Same two-step shape as above: filterable id selection first, then the full rows.
  // See above: createdAt must be in the select, otherwise the "distinctAlias" subquery
  // typeorm builds for skip/take cannot order by it.
  const idQuery = DbContribution.createQueryBuilder('Contribution').select([
    'Contribution.id',
    'Contribution.createdAt',
  ])
  applyCommunityWindow(idQuery)
  applyWalletFilter(idQuery, filter)

  const count = await idQuery.getCount()
  const contributionIds = await idQuery
    .orderBy('Contribution.createdAt', order)
    .addOrderBy('Contribution.id', order)
    .skip((currentPage - 1) * pageSize)
    .take(pageSize)
    .getMany()

  const contributions = await DbContribution.find({
    order: { createdAt: order, id: order },
    where: { id: In(contributionIds.map((contribution) => contribution.id)) },
  })
  return [contributions, count]
}

// Which groups have something to show in the community list right now. The dropdown then
// offers exactly what can be found behind it: a group that has been quiet for longer than
// the window drops out, and comes back by itself as soon as one of its contributions is
// filed again — no upkeep, and no line saying "nothing here for six months".
//
// Asked group by group through buildGroupTagPredicate — the very condition the filter and
// the moderator scope use — rather than as one clever join. A second derivation of "belongs
// to this group" would be a second place to drift apart, and this project has paid for that
// once already: the structured link wins, and a legacy inline "#tag" counts only where no
// group was ever assigned. One small count per group, and the list of groups is short.
//
// ⚠️ This is for the wallet's community filter alone. The submission field must go on
// offering EVERY group — a group dropped from there could never be woken up again, because
// nobody could file a contribution for it. The admin has to find old contributions, and
// "my contributions" is not windowed at all.
export const groupTagsInCommunityWindow = async (tags: string[]): Promise<string[]> => {
  const windowStart = communityWindowStart()
  const found = await Promise.all(
    tags.map(async (tag) => {
      const predicate = buildGroupTagPredicate(tag)
      const count = await DbContribution.createQueryBuilder('Contribution')
        .select('Contribution.id')
        .where(COMMUNITY_WINDOW_SQL, { communityWindowStart: windowStart })
        .andWhere(predicate.sql, predicate.params)
        .getCount()
      return count > 0 ? tag : null
    }),
  )
  return found.filter((tag): tag is string => tag !== null)
}

// The groups the submitter's own "my contributions" list has something to show for. Same
// idea as groupTagsInCommunityWindow, but for one user's own list: scoped to the user and
// NOT windowed, and it counts their deleted contributions too, because that list shows them
// (loadUserContributions loads withDeleted). So the filter offers exactly the groups that
// can be found behind it, and never one that would lead into an empty result.
export const groupTagsInUserContributions = async (
  userId: number,
  tags: string[],
): Promise<string[]> => {
  const found = await Promise.all(
    tags.map(async (tag) => {
      const predicate = buildGroupTagPredicate(tag)
      const count = await DbContribution.createQueryBuilder('Contribution')
        .select('Contribution.id')
        .where('Contribution.userId = :userId', { userId })
        .withDeleted()
        .andWhere(predicate.sql, predicate.params)
        .getCount()
      return count > 0 ? tag : null
    }),
  )
  return found.filter((tag): tag is string => tag !== null)
}

export const contributionFrontendLink = async (
  contributionId: number,
  _createdAt: Date,
): Promise<string> => {
  // TODO: page is sometimes wrong, use page 1 for now, and fix later with more time at hand
  // simplified, don't account for order by id, so when the nearly impossible case occur that createdAt is the same for two contributions,
  // maybe it is the wrong page
  //const countBefore = await DbContribution.count({
  //  where: { createdAt: MoreThan(createdAt) },
  //})
  // const page = Math.floor(countBefore / DEFAULT_PAGINATION_PAGE_SIZE) + 1
  const anchor = `${FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX}${contributionId}`
  return `${CONFIG.COMMUNITY_URL}/contributions/own-contributions/1#${anchor}`
}
