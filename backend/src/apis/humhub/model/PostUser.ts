import { User } from '@entity/User'

import { Account } from './Account'
import { Password } from './Password'
import { Profile } from './Profile'

export class PostUser {
  public constructor(user: User) {
    this.account = new Account(user)
    this.profile = new Profile(user)
  }

  account: Account
  profile: Profile
  password: Password
}
