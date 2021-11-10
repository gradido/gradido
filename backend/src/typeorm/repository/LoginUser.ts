import { EntityRepository, Repository } from 'typeorm'
import { LoginUser } from '@entity/LoginUser'

@EntityRepository(LoginUser)
export class LoginUserRepository extends Repository<LoginUser> {}
