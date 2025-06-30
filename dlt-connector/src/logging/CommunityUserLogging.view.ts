import { CommunityUser } from '@/graphql/input/CommunityUser'

import { AbstractLoggingView } from './AbstractLogging.view'

export class CommunityUserLoggingView extends AbstractLoggingView {
  public constructor(private self: CommunityUser) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      uuid: this.self.uuid,
      accountNr: this.self.accountNr,
    }
  }
}
