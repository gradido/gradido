import { Brackets, EntityRepository, ObjectLiteral, Repository } from '@dbTools/typeorm'
import { User } from '@entity/User'

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('hex(user.pubKey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }

  async findByPubkeyHexBuffer(pubkeyHexBuffer: Buffer): Promise<User> {
    const pubKeyString = pubkeyHexBuffer.toString('hex')
    return await this.findByPubkeyHex(pubKeyString)
  }

  async findByEmail(email: string): Promise<User> {
    return this.createQueryBuilder('user').where('user.email = :email', { email }).getOneOrFail()
  }

  async getUsersIndiced(userIds: number[]): Promise<User[]> {
    if (!userIds.length) return []
    const users = await this.createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
      .where('user.id IN (:...users)', { users: userIds })
      .getMany()
    const usersIndiced: User[] = []
    users.forEach((value) => {
      usersIndiced[value.id] = value
    })
    return usersIndiced
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
