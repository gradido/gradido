import { Factory, Seeder } from 'typeorm-seeding'
import { raeuberHotzenplotz } from './raeuber-hotzenplotz'
import { userSeeder } from '../helpers/user-helpers'

export class CreateRaeuberHotzenplotzSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, raeuberHotzenplotz)
  }
}
