import { Factory, Seeder } from 'typeorm-seeding'
import { bibiBloxberg } from './bibi-bloxberg'
import { userSeeder } from '../helpers/user-helpers'

export class CreateBibiBloxbergSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, bibiBloxberg)
  }
}
