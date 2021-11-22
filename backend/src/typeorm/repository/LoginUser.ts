import { EntityRepository, Repository } from 'typeorm'
import { LoginUser } from '@entity/LoginUser'

@EntityRepository(LoginUser)
export class LoginUserRepository extends Repository<LoginUser> {
  async findByEmail(email: string): Promise<LoginUser> {
    return this.createQueryBuilder('loginUser')
      .where('loginUser.email = :email', { email })
      .getOneOrFail()
  }
}
