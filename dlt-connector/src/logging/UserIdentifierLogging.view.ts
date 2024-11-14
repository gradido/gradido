import { UserIdentifier } from '@/graphql/input/UserIdentifier'

import { AbstractLoggingView } from './AbstractLogging.view'
import { CommunityUserLoggingView } from './CommunityUserLogging.view'
import { IdentifierSeedLoggingView } from './IdentifierSeedLogging.view'

export class UserIdentifierLoggingView extends AbstractLoggingView {
  public constructor(private self: UserIdentifier) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      communityUuid: this.self.communityUuid,
      communityUser: this.self.communityUser
        ? new CommunityUserLoggingView(this.self.communityUser).toJSON()
        : undefined,
      seed: this.self.seed ? new IdentifierSeedLoggingView(this.self.seed).toJSON() : undefined,
    }
  }
}
