import { User, UserRole } from 'database'

import { RoleNames } from '@enum/RoleNames'

export class UserLogic {
  public constructor(private self: User) {}
  public isRole(role: RoleNames): boolean {
    return this.self.userRoles.some((value: UserRole) => value.role === role.toString())
  }
}
