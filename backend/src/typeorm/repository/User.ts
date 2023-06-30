import { Brackets, EntityRepository, IsNull, Not, Repository } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { ROLE_NAMES } from '@/auth/ROLES'
import { SearchUsersFilters } from '@/graphql/arg/SearchUsersFilters'

@EntityRepository(DbUser)
export class UserRepository extends Repository<DbUser> {
  async findBySearchCriteriaPagedFiltered(
    select: string[],
    searchCriteria: string,
    filters: SearchUsersFilters | null,
    currentPage: number,
    pageSize: number,
  ): Promise<[DbUser[], number]> {
    const selectAttr = [
      'user.id AS user_id',
      'user.email_id AS user_email_id',
      'user.first_name AS user_first_name',
      'user.last_name AS user_last_name',
      'user.deleted_at AS user_deleted_at',
      'count',
    ]
    const query = this.createQueryBuilder('user')
      .select(selectAttr)
      .withDeleted()
      .leftJoinAndSelect('user.emailContact', 'emailContact')
      .leftJoinAndSelect('user.userRoles', 'userRoles', 'userRoles.role in :rolenames', {
        rolenames: [ROLE_NAMES.ROLE_NAME_ADMIN, ROLE_NAMES.ROLE_NAME_MODERATOR],
      })
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
    /*
    filterCriteria.forEach((filter) => {
      query.andWhere(filter)
    })
    */
    if (filters) {
      if (filters.byActivated !== null) {
        query.andWhere('emailContact.emailChecked = :value', { value: filters.byActivated })
        // filterCriteria.push({ 'emailContact.emailChecked': filters.byActivated })
      }

      if (filters.byDeleted !== null) {
        // filterCriteria.push({ deletedAt: filters.byDeleted ? Not(IsNull()) : IsNull() })
        query.andWhere({ deletedAt: filters.byDeleted ? Not(IsNull()) : IsNull() })
      }
    }
    console.log('query=', query.getQueryAndParameters())
    return query
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  }
}
