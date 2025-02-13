import { User } from '@entity/User'

import { AbstractUser } from './AbstractUser'

export class GetUser extends AbstractUser {
  public constructor(user: User, id: number) {
    super(user)
    this.id = id
  }

  id: number
  guid: string
  // eslint-disable-next-line camelcase
  display_name: string
}
