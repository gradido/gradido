import { AbstractLoggingView } from '@logging/AbstractLogging.view'

import { PostUser } from '@/apis/humhub/model/PostUser'

import { AccountLoggingView } from './AccountLogging.view'
import { ProfileLoggingView } from './ProfileLogging.view'

export class PostUserLoggingView extends AbstractLoggingView {
  public constructor(private self: PostUser) {
    super()
  }

  public toJSON(): PostUser {
    return {
      account: new AccountLoggingView(this.self.account).toJSON(),
      profile: new ProfileLoggingView(this.self.profile).toJSON(),
      password: {
        newPassword: '',
        mustChangePassword: false,
      },
    }
  }
}
