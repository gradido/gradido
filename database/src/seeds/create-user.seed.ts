import { Factory, Seeder } from 'typeorm-seeding'
import { User } from '../../entity/User'
// import { LoginUser } from '../../entity/LoginUser'

/*
interface UserContext {
  // from login user (contains state user)
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  description?: string
  password?: BigInt
  pubKey?: Buffer
  privKey?: Buffer
  emailHash?: Buffer
  createdAt?: Date
  emailChecked?: boolean
  passphraseShown?: boolean
  language?: string
  disabled?: boolean
  groupId?: number
  publisherId?: number
  // from login user backup
  passphrase?: string
  mnemonicType?: number
  // from server user
  role?: string
  activated?: number
  lastLogin?: Date
  modified?: Date
  // flag for admin
  isAdmin?: boolean
}
*/

export class CreateUserSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    // const loginUser = await factory(LoginUser)().make()
    // console.log(loginUser.email)
    await factory(User)().create()
  }
}
