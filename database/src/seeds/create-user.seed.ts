import { Factory, Seeder } from 'typeorm-seeding'
import { User } from '../../entity/User'

export class CreateUserSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(User)({
      email: 'peter@lustig.de',
      firstName: 'Peter',
      lastName: 'Lustig',
      username: 'peter',
    }).create()
  }
}
