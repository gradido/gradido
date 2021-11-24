import { Resolver, Query, Arg, Args } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { UserRepository } from '../../typeorm/repository/User'

@Resolver()
export class AdminResolver {
  @Query(() => [UserAdmin])
  async searchUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUsers = await loginUserRepository.findBySearchCriteria(searchText)
    const users = loginUsers.map((loginUser) => {
      const user = new UserAdmin()
      user.firstName = loginUser.firstName
      user.lastName = loginUser.lastName
      user.email = loginUser.email
      user.creation = [
        (Math.floor(Math.random() * 50) + 1) * 20,
        (Math.floor(Math.random() * 50) + 1) * 20,
        (Math.floor(Math.random() * 50) + 1) * 20,
      ]
      return user
    })
    return users
  }

  @Query(() => Boolean)
  async createPendingCreation(
    @Args() { email, amount, note, creationDate }: CreatePendingCreationArgs,
  ): Promise<boolean> {
    // TODO: Check user validity
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)
    return true
  }
}
