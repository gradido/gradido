import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { User } from '@entity/User'

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('hex(user.pubKey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }

  async getUsersIndiced(userIds: number[]): Promise<User[]> {
    return this.createQueryBuilder('user')
      .withDeleted() // We need to show the name for deleted users for old transactions
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .where('user.id IN (:...userIds)', { userIds })
      .getMany()
  }

  async findBySearchCriteriaPagedFiltered(
    select: string[],
    searchCriteria: string,
    filterCriteria: ObjectLiteral[],
    currentPage: number,
    pageSize: number,
  ): Promise<[User[], number]> {
    return await this.createQueryBuilder('user')
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
      .andWhere(filterCriteria)
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  }
}
