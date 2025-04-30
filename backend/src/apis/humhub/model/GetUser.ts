import { User } from 'database'

import { AbstractUser } from './AbstractUser'

export class GetUser extends AbstractUser {
  public constructor(user: User, id: number) {
    super(user)
    this.id = id
  }

  id: number
  guid: string

  display_name: string
}
