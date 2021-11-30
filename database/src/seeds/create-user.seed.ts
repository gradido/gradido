import { Factory, Seeder } from 'typeorm-seeding'
import { User } from '../../entity/User'
// import { LoginUser } from '../../entity/LoginUser'

export class CreateUserSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    // const loginUser = await factory(LoginUser)().make()
    // console.log(loginUser.email)
    await factory(User)().create()
  }
}
