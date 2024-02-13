import { UserIdentifier } from '@/graphql/input/UserIdentifier'

import { AbstractLoggingView } from './AbstractLogging.view'

export class UserIdentifierLoggingView extends AbstractLoggingView {
  public constructor(private self: UserIdentifier) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      uuid: this.self.uuid,
      communityUuid: this.self.communityUuid,
      accountNr: this.self.accountNr,
    }
  }
}
