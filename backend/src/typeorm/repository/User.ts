import { EntityRepository, Repository } from 'typeorm'
import { User } from '@entity/User'

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findByPubkeyHex(pubkeyHex: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('hex(user.pubkey) = :pubkeyHex', { pubkeyHex })
      .getOneOrFail()
  }

  async getUsersIndiced(userIds: number[]): Promise<User[]> {
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
}
