import { getConnection, Brackets, IsNull, Not } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { Order } from '@enum/Order'

import { LogError } from '@/server/LogError'

export const findUsers = async (
  select: string[],
  searchCriteria: string,
  filters: SearchUsersFilters | null,
  currentPage: number,
  pageSize: number,
  order = Order.ASC,
): Promise<[DbUser[], number]> => {
  const queryRunner = getConnection().createQueryRunner()
  try {
    await queryRunner.connect()
    const query = queryRunner.manager
      .createQueryBuilder(DbUser, 'user')
      .select(select)
      .withDeleted()
      .leftJoinAndSelect('user.emailContact', 'emailContact')
      .where(
        new Brackets((qb) => {
          qb.where(
            'user.firstName like :name or user.lastName like :lastName or emailContact.email like :email',
            {
              name: `%${searchCriteria}%`,
              lastName: `%${searchCriteria}%`,
              email: `%${searchCriteria}%`,
            },
          )
        }),
      )
    if (filters) {
      if (filters.byActivated !== null) {
        query.andWhere('emailContact.emailChecked = :value', { value: filters.byActivated })
      }

      if (filters.byDeleted !== null) {
        query.andWhere({ deletedAt: filters.byDeleted ? Not(IsNull()) : IsNull() })
      }
    }

    return await query
      .orderBy({ 'user.id': order })
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  } catch (err) {
    throw new LogError('Unable to search users', err)
  } finally {
    await queryRunner.release()
  }
}
