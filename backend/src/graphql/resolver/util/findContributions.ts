import { In, Like, Not } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'

import { Paginated } from '@arg/Paginated'
import { SearchContributionsFilterArgs } from '@arg/SearchContributionsFilterArgs'
import { Connection } from '@typeorm/connection'

import { LogError } from '@/server/LogError'

interface Relations {
  [key: string]: boolean | Relations
}

export const findContributions = async (
  paginate: Paginated,
  filter: SearchContributionsFilterArgs,
  withDeleted = false,
  relations: Relations | undefined = undefined,
): Promise<[DbContribution[], number]> => {
  const connection = await Connection.getInstance()
  if (!connection) {
    throw new LogError('Cannot connect to db')
  }
  const requiredWhere = {
    ...(filter.statusFilter?.length && { contributionStatus: In(filter.statusFilter) }),
    ...(filter.userId && { userId: filter.userId }),
    ...(filter.noHashtag && { memo: Not(Like(`%#%`)) }),
  }
  const queryBuilder = connection.getRepository(DbContribution).createQueryBuilder('Contribution')
  queryBuilder.where(requiredWhere)
  return queryBuilder.getManyAndCount()
  /*
  

  let where =
    filter.query && relations?.user
      ? [
          {
            ...requiredWhere, // And
            user: {
              firstName: Like(`%${filter.query}%`),
            },
          }, // Or
          {
            ...requiredWhere,
            user: {
              lastName: Like(`%${filter.query}%`),
            },
          }, // Or
          {
            ...requiredWhere, // And
            user: {
              emailContact: {
                email: Like(`%${filter.query}%`),
              },
            },
          }, // Or
          {
            ...requiredWhere, // And
            memo: Like(`%${filter.query}%`),
          },
        ]
      : requiredWhere

  if (!relations?.user && filter.query) {
    where = [{ ...requiredWhere, memo: Like(`%${filter.query}%`) }]
  }

  return DbContribution.findAndCount({
    relations,
    where,
    withDeleted,
    order: {
      createdAt: paginate.order,
      id: paginate.order,
    },
    skip: (paginate.currentPage - 1) * paginate.pageSize,
    take: paginate.pageSize,
  })
  */
}
