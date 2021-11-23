import { Resolver, Query } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import { LoginUser } from '@entity/LoginUser'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'

@Resolver()
export class AdminResolver {
  @Query(() => [LoginUser])
  async getUsers(searchText: string): Promise<LoginUser[]> {
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const users = loginUserRepository.findUserByFilter(searchText)
    return users
  }
}
