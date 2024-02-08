import { User } from '@entity/User'

import { AbstractLoggingView } from './AbstractLogging.view'

export class UserLoggingView extends AbstractLoggingView {
  public constructor(private user: User) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.user.id,
      gradidoId: this.user.gradidoID,
      derive1Pubkey: this.user.derive1Pubkey.toString(this.bufferStringFormat),
      createdAt: this.dateToString(this.user.createdAt),
      confirmedAt: this.dateToString(this.user.confirmedAt),
    }
  }
}
