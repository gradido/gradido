import { Factory, Seeder } from 'typeorm-seeding'
import { User } from '../../../entity/User'
import { LoginUser } from '../../../entity/LoginUser'
import { LoginUserBackup } from '../../../entity/LoginUserBackup'
import { ServerUser } from '../../../entity/ServerUser'
import { LoginUserRoles } from '../../../entity/LoginUserRoles'
import {
  createUserContext,
  createLoginUserContext,
  createLoginUserBackupContext,
  createServerUserContext,
  createLoginUserRolesContext,
} from '../helpers/user-helpers'
import { peterLustig } from './peter-lustig'

const userData = peterLustig

export class CreatePeterLustigSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(User)(createUserContext(userData)).create()
    const loginUser = await factory(LoginUser)(createLoginUserContext(userData)).create()
    await factory(LoginUserBackup)(createLoginUserBackupContext(userData, loginUser)).create()

    if (userData.isAdmin) {
      await factory(ServerUser)(createServerUserContext(userData)).create()

      // This is crazy: we just need the relation to roleId but no role at all
      // It works with LoginRoles empty!!
      await factory(LoginUserRoles)(createLoginUserRolesContext(loginUser)).create()
    }
  }
}
