import { Paginated } from '@arg/Paginated'
import { FindManyOptions } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'

function buildBaseOptions(paginated: Paginated): FindManyOptions<DbContribution> {
  const { order, currentPage, pageSize } = paginated
  return {
    order: { createdAt: order, id: order },
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
  return DbContribution.findAndCount({
    where: { userId },
    relations: { messages: { user: true } },
    ...buildBaseOptions(paginated),
  })
}

/*
 * Load all contributions
 * @param paginated pagination, see {@link Paginated}
 */
export const loadAllContributions = async (
  paginated: Paginated,
): Promise<[DbContribution[], number]> => {
  return DbContribution.findAndCount({
    relations: { user: true },
    ...buildBaseOptions(paginated),
  })
}
