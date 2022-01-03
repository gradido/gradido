import { Factory, Seeder } from 'typeorm-seeding'
import { bobBaumeister } from './bob-baumeister'
import { userSeeder } from '../helpers/user-helpers'

export class CreateBobBaumeisterSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, bobBaumeister)
  }
}
