import { Factory, Seeder } from 'typeorm-seeding'
import { peterLustig } from './peter-lustig'
import { userSeeder } from '../helpers/user-helpers'

export class CreatePeterLustigSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await userSeeder(factory, peterLustig)
  }
}
