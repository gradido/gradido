import { DbUser, User } from 'database'

import { Account } from './Account'
import { Profile } from './Profile'

export abstract class AbstractUser {
  public constructor(user: User | DbUser) {
    this.account = new Account(user)
    this.profile = new Profile(user)
  }

  account: Account
  profile: Profile
}
