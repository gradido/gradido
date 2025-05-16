import { Paginated } from '@arg/Paginated'
import { Contribution as DbContribution } from 'database'
import { FindManyOptions } from 'typeorm'

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
  messagePagination?: Paginated,
): Promise<[DbContribution[], number]> => {
  const { order } = paginated
  const { order: messageOrder } = messagePagination || { order: 'ASC' }
  return DbContribution.findAndCount({
    where: { userId },
    withDeleted: true,
    relations: { messages: { user: true } },
    order: { createdAt: order, id: order, messages: { createdAt: messageOrder } },
    ...buildPaginationOptions(paginated),
  })
}

/*
 * Load all contributions
 * @param paginated pagination, see {@link Paginated}
 */
export const loadAllContributions = async (
  paginated: Paginated,
): Promise<[DbContribution[], number]> => {
  const { order } = paginated
  return DbContribution.findAndCount({
    relations: { user: { emailContact: true } },
    order: { createdAt: order, id: order },
    ...buildPaginationOptions(paginated),
  })
}
