import { DltUser } from '../entity/DltUser'
import { AbstractLoggingView } from './AbstractLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class DltUserLoggingView extends AbstractLoggingView {
  public constructor(private self: DltUser) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.self.id,
      user: this.self.user
        ? new UserLoggingView(this.self.user).toJSON()
        : { id: this.self.userId },
      messageId: this.self.messageId,
      verified: this.self.verified,
      createdAt: this.dateToString(this.self.createdAt),
      verifiedAt: this.dateToString(this.self.verifiedAt),
    }
  }
}
