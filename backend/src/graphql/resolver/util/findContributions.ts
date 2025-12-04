import { Paginated } from '@arg/Paginated'
import { SearchContributionsFilterArgs } from '@arg/SearchContributionsFilterArgs'
import { AppDatabase, Contribution as DbContribution } from 'database'
import { Brackets, In, IsNull, LessThanOrEqual, Like, Not, SelectQueryBuilder } from 'typeorm'

import { LogError } from '@/server/LogError'

interface Relations {
  [key: string]: boolean | Relations
}

function joinRelationsRecursive(
  relations: Relations,
  queryBuilder: SelectQueryBuilder<DbContribution>,
  currentPath: string,
): void {
  for (const key in relations) {
    queryBuilder.leftJoinAndSelect(`${currentPath}.${key}`, key)
    if (typeof relations[key] === 'object') {
      // If it's a nested relation
      joinRelationsRecursive(relations[key] as Relations, queryBuilder, key)
    }
  }
}

export const findContributions = async (
  { pageSize, currentPage, order }: Paginated,
  filter: SearchContributionsFilterArgs,
  withDeleted = false,
  relations: Relations | undefined = undefined,
  countOnly = false,
): Promise<[DbContribution[], number]> => {
  const connection = AppDatabase.getInstance()
  if (!connection.isConnected()) {
    throw new LogError('Cannot connect to db')
  }
  const queryBuilder = connection
    .getDataSource()
    .getRepository(DbContribution)
    .createQueryBuilder('Contribution')
  if (relations) {
    joinRelationsRecursive(relations, queryBuilder, 'Contribution')
  }
  if (withDeleted) {
    queryBuilder.withDeleted()
  }
  queryBuilder.where({
    ...(filter.statusFilter?.length && { contributionStatus: In(filter.statusFilter) }),
    ...(filter.userId && { userId: filter.userId }),
    ...(filter.noHashtag && { memo: Not(Like(`%#%`)) }),
  })
  if (filter.hideResubmission) {
    const now = new Date(new Date().toUTCString())
    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where({ resubmissionAt: IsNull() }).orWhere({ resubmissionAt: LessThanOrEqual(now) })
      }),
    )
  }
  queryBuilder.printSql()
  if (filter.query) {
    const queryString = '%' + filter.query + '%'
    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where({ memo: Like(queryString) })
        if (relations?.user) {
          qb.orWhere('user.first_name LIKE :firstName', { firstName: queryString })
            .orWhere('user.last_name LIKE :lastName', { lastName: queryString })
            .orWhere('emailContact.email LIKE :emailContact', { emailContact: queryString })
            .orWhere({ memo: Like(queryString) })
        }
      }),
    )
  }
  if (countOnly) {
    return [[], await queryBuilder.getCount()]
  }
  return queryBuilder
    .orderBy('Contribution.createdAt', order)
    .addOrderBy('Contribution.id', order)
    .skip((currentPage - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount()
}
