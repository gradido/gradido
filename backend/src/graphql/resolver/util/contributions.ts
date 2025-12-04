import { Paginated } from '@arg/Paginated'
import { Contribution as DbContribution } from 'database'
import { FindManyOptions, In, MoreThan } from 'typeorm'
import { CONFIG } from '@/config'
import { Order } from '@/graphql/enum/Order'
import {
  DEFAULT_PAGINATION_PAGE_SIZE,
  FRONTEND_CONTRIBUTIONS_ITEM_ANCHOR_PREFIX,
} from '@/graphql/resolver/const/const'

// TODO: combine with Pagination class for all queries to use
function buildPaginationOptions(paginated: Paginated): FindManyOptions<DbContribution> {
  const { currentPage, pageSize } = paginated
  return {
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  }
}

/*
 * Load user contributions with messages
 * @param userId if userId is set, load all contributions of the user, with messages
 * @param paginated pagination, see {@link Paginated}
 */
export const loadUserContributions = async (
  userId: number,
  paginated: Paginated,
): Promise<[DbContribution[], number]> => {
  const { order } = paginated
  // manual, faster and simpler queries as auto generated from typeorm
  const countPromise = DbContribution.count({
    select: { id: true },
    where: { userId },
    withDeleted: true,
  })
  // we collect all contributions, ignoring if user exist or not
  const contributionIds = await DbContribution.find({
    select: { id: true },
    where: { userId },
    withDeleted: true,
    order: { createdAt: order, id: order },
    ...buildPaginationOptions(paginated),
  })
  const contributionsPromise = DbContribution.find({
    relations: { messages: { user: true } },
    withDeleted: true,
    order: { createdAt: order, id: order, messages: { createdAt: Order.ASC } },
    where: { id: In(contributionIds.map((c) => c.id)) },
  })
  return [await contributionsPromise, await countPromise]

  // original code
  // note: typeorm will create similar queries as above, but more complex and slower
  /*
  return DbContribution.findAndCount({
    where: { userId },
    withDeleted: true,
    relations: { messages: { user: true } },
    order: { createdAt: order, id: order, messages: { createdAt: Order.ASC } },
    ...buildPaginationOptions(paginated),
  })
  */
}

/*
 * Load all contributions
 * @param paginated pagination, see {@link Paginated}
 */
export const loadAllContributions = async (
  paginated: Paginated,
): Promise<[DbContribution[], number]> => {
  const { order } = paginated
  // manual, faster queries as auto generated from typeorm
  const countPromise = DbContribution.count({ select: { id: true } })
  // console.log('loadAllContributions', { count })

  const contributionIds = await DbContribution.find({
    select: { id: true },
    order: { createdAt: order, id: order },
    ...buildPaginationOptions(paginated),
  })
  const contributionsPromise = DbContribution.find({
    relations: { user: { emailContact: true } },
    order: { createdAt: order, id: order },
    where: { id: In(contributionIds.map((c) => c.id)) },
  })
  return [await contributionsPromise, await countPromise]

  // original code
  // note: typeorm will create similar queries as above, but more complex and slower
  /*
  return DbContribution.findAndCount({
    relations: { user: { emailContact: true } },
    order: { createdAt: order, id: order },
    ...buildPaginationOptions(paginated),
  })
  */
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
