import { AbstractLoggingView } from 'database'

import { Account } from '@/apis/humhub/model/Account'

export class AccountLoggingView extends AbstractLoggingView {
  public constructor(private self: Account) {
    super()
  }

  public toJSON(): Account {
    return {
      username: this.self.username.substring(0, 3) + '...',
      email: this.self.email.substring(0, 3) + '...',
      language: this.self.language,
      status: this.self.status,
    }
  }
}
