import { In, Like } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'

import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'

interface FindContributionsOptions {
  order: Order
  currentPage: number
  pageSize: number
  withDeleted?: boolean
  relations?: string[]
  userId?: number | null
  statusFilter?: ContributionStatus[] | null
  query?: string | null
}

export const findContributions = async (
  options: FindContributionsOptions,
): Promise<[DbContribution[], number]> => {
  const { order, currentPage, pageSize, withDeleted, relations, userId, statusFilter, query } = {
    withDeleted: false,
    relations: [],
    ...options,
  }
  const requiredWhere = {
    ...(statusFilter?.length && { contributionStatus: In(statusFilter) }),
    ...(userId && { userId }),
  }

  const where = query
    ? [
        { ...requiredWhere, name: Like(`%${query}%`) },
        { ...requiredWhere, lastName: Like(`%${query}%`) },
        { ...requiredWhere, email: Like(`%${query}%`) },
      ]
    : requiredWhere
  return DbContribution.findAndCount({
    where,
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
