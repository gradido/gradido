import { Factory, Seeder } from 'typeorm-seeding'
import { stephenHawking } from './stephen-hawking'
import { userSeeder } from '../helpers/user-helpers'

export class CreateStephenHawkingSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, stephenHawking)
  }
}
