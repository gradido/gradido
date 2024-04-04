import { Account } from './Account'
import { Profile } from './Profile'

export class GetUser {
  id: number
  guid: string
  // eslint-disable-next-line camelcase
  display_name: string
  account: Account
  profile: Profile
}
