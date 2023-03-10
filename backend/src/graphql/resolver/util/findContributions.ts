import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'
import { Contribution as DbContribution } from '@entity/Contribution'
import { In } from '@dbTools/typeorm'

interface FindContributionsOptions {
  order: Order
  currentPage: number
  pageSize: number
  withDeleted?: boolean
  relations?: string[]
  userId?: number | null
  statusFilter?: ContributionStatus[] | null
}

export const findContributions = async (
  options: FindContributionsOptions,
): Promise<[DbContribution[], number]> => {
  const { order, currentPage, pageSize, withDeleted, relations, userId, statusFilter } = {
    withDeleted: false,
    relations: [],
    ...options,
  }
  return DbContribution.findAndCount({
    where: {
      ...(statusFilter && statusFilter.length && { contributionStatus: In(statusFilter) }),
      ...(userId && { userId }),
    },
    withDeleted,
    order: {
      createdAt: order,
      id: order,
    },
    relations,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
}
