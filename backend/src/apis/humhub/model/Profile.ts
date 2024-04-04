/* eslint-disable camelcase */
import { User } from '@entity/User'

import { CONFIG } from '@/config'

export class Profile {
  public constructor(user: User) {
    this.firstname = user.firstName
    this.lastname = user.lastName
    if (user.alias && user.alias.length > 2) {
      this.gradido_address = CONFIG.COMMUNITY_NAME + '/' + user.alias
    } else {
      this.gradido_address = CONFIG.COMMUNITY_NAME + '/' + user.gradidoID
    }
  }

  firstname: string
  lastname: string
  gradido_address: string
  about: string
}
