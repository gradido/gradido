import { UserRole } from '../entity'
import { AbstractLoggingView } from './AbstractLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class UserRoleLoggingView extends AbstractLoggingView {
  public constructor(
    private self: UserRole,
    private showUser = true,
  ) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      user:
        this.showUser && this.self.user
          ? new UserLoggingView(this.self.user).toJSON()
          : { id: this.self.userId },
      role: this.self.role,
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
    }
  }
}
