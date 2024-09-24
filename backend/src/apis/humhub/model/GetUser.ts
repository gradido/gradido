import { User } from '@entity/User'

import { Account } from './Account'
import { Profile } from './Profile'

export class GetUser {
  public constructor(user: User, id: number) {
    this.id = id
    this.account = new Account(user)
    this.profile = new Profile(user)
  }

  id: number
  guid: string
  // eslint-disable-next-line camelcase
  display_name: string
  account: Account
  profile: Profile
}
