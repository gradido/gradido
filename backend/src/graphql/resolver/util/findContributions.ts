import { In, Like } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'

import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'

interface Relations {
  [key: string]: boolean | Relations
}

interface FindContributionsOptions {
  order: Order
  currentPage: number
  pageSize: number
  withDeleted?: boolean
  relations?: Relations | undefined
  userId?: number | null
  statusFilter?: ContributionStatus[] | null
  query?: string | null
}

export const findContributions = async (
  options: FindContributionsOptions,
): Promise<[DbContribution[], number]> => {
  const { order, currentPage, pageSize, withDeleted, relations, userId, statusFilter, query } = {
    withDeleted: false,
    relations: undefined,
    query: '',
    ...options,
  }

  const requiredWhere = {
    ...(statusFilter?.length && { contributionStatus: In(statusFilter) }),
    ...(userId && { userId }),
  }

  const where =
    query && relations && relations.user
      ? [
          {
            ...requiredWhere,
            user: {
              firstName: Like(`%${query}%`),
            },
          },
          {
            ...requiredWhere,
            user: {
              lastName: Like(`%${query}%`),
            },
          },
          {
            ...requiredWhere,
            user: {
              emailContact: {
                email: Like(`%${query}%`),
              },
            },
          },
        ]
      : requiredWhere

  return DbContribution.findAndCount({
    relations,
    where,
    withDeleted,
    order: {
      createdAt: order,
      id: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
}
