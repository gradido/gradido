import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { User } from '@entity/User'

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .where('hex(user.pubKey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }

  async findBySearchCriteriaPagedFiltered(
    select: string[],
    searchCriteria: string,
    filterCriteria: ObjectLiteral[],
    currentPage: number,
    pageSize: number,
  ): Promise<[User[], number]> {
    const query = await this.createQueryBuilder('user')
      .select(select)
      .withDeleted()
      .where(
        new Brackets((qb) => {
          qb.where(
            'user.firstName like :name or user.lastName like :lastName or user.email like :email',
            {
              name: `%${searchCriteria}%`,
              lastName: `%${searchCriteria}%`,
              email: `%${searchCriteria}%`,
            },
          )
        }),
      )
    filterCriteria.forEach((filter) => {
      query.andWhere(filter)
    })
    return query
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  }
}
