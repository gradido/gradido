import { User } from '@entity/User'

import { Account } from './Account'
import { Profile } from './Profile'

export abstract class AbstractUser {
  public constructor(user: User) {
    this.account = new Account(user)
    this.profile = new Profile(user)
  }

  account: Account
  profile: Profile
}
