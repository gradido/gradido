import { In, Like, FindOperator } from '@dbTools/typeorm'
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
    query: '',
    ...options,
  }
  const where: {
    userId?: number | undefined
    contributionStatus?: FindOperator<ContributionStatus> | undefined
    user?: Record<string, FindOperator<string>>[] | undefined
  } = {
    ...(statusFilter?.length && { contributionStatus: In(statusFilter) }),
    ...(userId && { userId }),
  }

  if (query) {
    where.user = [
      { firstName: Like(`%${query}%`) },
      { lastName: Like(`%${query}%`) },
      // emailContact:  { email: Like(`%${query}%`) },
    ]
  }

  return DbContribution.findAndCount({
    relations: {
      user: {
        emailContact: true,
      },
      messages: true,
    },
    withDeleted,
    where,
    order: {
      createdAt: order,
      id: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
}
