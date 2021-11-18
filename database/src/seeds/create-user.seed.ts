import { Factory, Seeder } from 'typeorm-seeding'
import { User } from '../../entity/User'

export class CreateUserSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(User)().create()
  }
}
