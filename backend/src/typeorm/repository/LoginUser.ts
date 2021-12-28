import { EntityRepository, Repository } from 'typeorm'
import { LoginUser } from '@entity/LoginUser'

@EntityRepository(LoginUser)
export class LoginUserRepository extends Repository<LoginUser> {
  async findByEmail(email: string): Promise<LoginUser> {
    return this.createQueryBuilder('loginUser')
      .where('loginUser.email = :email', { email })
      .getOneOrFail()
  }

  async findBySearchCriteria(searchCriteria: string): Promise<LoginUser[]> {
    return await this.createQueryBuilder('user')
      .where(
        'user.firstName like :name or user.lastName like :lastName or user.email like :email',
        {
          name: `%${searchCriteria}%`,
          lastName: `%${searchCriteria}%`,
          email: `%${searchCriteria}%`,
        },
      )
      .getMany()
  }
}
