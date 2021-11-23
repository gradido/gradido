import { Resolver, Query, Arg } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'

@Resolver()
export class AdminResolver {
  @Query(() => [UserAdmin])
  async getUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUsers = await loginUserRepository.findBySearchCriteria(searchText)
    const users = loginUsers.map((loginUser) => {
      const user = new UserAdmin()
      user.firstName = loginUser.firstName
      user.lastName = loginUser.lastName
      user.email = loginUser.email
      return user
    })
    return users
  }
}
