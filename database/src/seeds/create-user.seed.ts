import { Factory, Seeder } from 'typeorm-seeding'
import { userSeeder } from './helpers/user-helpers'

export class CreateUserSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, {})
  }
}
