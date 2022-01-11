import { Factory, Seeder } from 'typeorm-seeding'
import { garrickOllivander } from './garrick-ollivander'
import { userSeeder } from '../helpers/user-helpers'

export class CreateGarrickOllivanderSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, garrickOllivander)
  }
}
