import SearchUsersFilters from '@/graphql/arg/SearchUsersFilters'
import { Brackets, EntityRepository, IsNull, Not, Repository } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

@EntityRepository(DbUser)
export class UserRepository extends Repository<DbUser> {
  async findByPubkeyHex(pubkeyHex: string): Promise<DbUser> {
    const dbUser = await this.createQueryBuilder('user')
      .leftJoinAndSelect('user.emailContact', 'emailContact')
      .where('hex(user.pubKey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
    /*
    const dbUser = await this.findOneOrFail(`hex(user.pubKey) = { pubkeyHex }`)
    const emailContact = await this.query(
      `SELECT * from user_contacts where id = { dbUser.emailId }`,
    )
    dbUser.emailContact = emailContact
    */
    return dbUser
  }

  async findBySearchCriteriaPagedFiltered(
    select: string[],
    searchCriteria: string,
    filters: SearchUsersFilters,
    currentPage: number,
    pageSize: number,
  ): Promise<[DbUser[], number]> {
    const query = this.createQueryBuilder('user')
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

    return query
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  }
}
