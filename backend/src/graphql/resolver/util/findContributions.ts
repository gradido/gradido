import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'
import { Contribution as DbContribution } from '@entity/Contribution'
import { In } from '@dbTools/typeorm'

export const findContributions = async (
  order: Order,
  currentPage: number,
  pageSize: number,
  withDeleted: boolean,
  statusFilter?: ContributionStatus[],
): Promise<[DbContribution[], number]> =>
  DbContribution.findAndCount({
    where: {
      ...(statusFilter && statusFilter.length && { contributionStatus: In(statusFilter) }),
    },
    withDeleted: withDeleted,
    order: {
      createdAt: order,
      id: order,
    },
    relations: ['user'],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
