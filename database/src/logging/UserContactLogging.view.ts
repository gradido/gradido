import { UserContact } from '../entity'
import { AbstractLoggingView } from './AbstractLogging.view'
import { UserLoggingView } from './UserLogging.view'

enum OptInType {
  EMAIL_OPT_IN_REGISTER = 1,
  EMAIL_OPT_IN_RESET_PASSWORD = 2,
}

export class UserContactLoggingView extends AbstractLoggingView {
  public constructor(
    private self: UserContact,
    private showUser = true,
  ) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      type: this.self.type,
      user:
        this.showUser && this.self.user
          ? new UserLoggingView(this.self.user).toJSON()
          : { id: this.self.userId },
      email: this.self.email?.substring(0, 3) + '...',
      emailVerificationCode: this.self.emailVerificationCode?.substring(0, 4) + '...',
      emailOptInTypeId: OptInType[this.self.emailOptInTypeId],
      emailResendCount: this.self.emailResendCount,
      emailChecked: this.self.emailChecked,
      phone: this.self.phone ? this.self.phone.substring(0, 3) + '...' : undefined,
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
      deletedAt: this.dateToString(this.self.deletedAt),
    }
  }
}
