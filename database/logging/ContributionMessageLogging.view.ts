import { ContributionMessage } from '../entity/ContributionMessage'
import { AbstractLoggingView } from './AbstractLogging.view'
import { ContributionLoggingView } from './ContributionLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class ContributionMessageLoggingView extends AbstractLoggingView {
  public constructor(private self: ContributionMessage) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.self.id,
      contribution: this.self.contribution
        ? new ContributionLoggingView(this.self.contribution).toJSON()
        : { id: this.self.contributionId },
      user: this.self.user
        ? new UserLoggingView(this.self.user).toJSON()
        : { id: this.self.userId },
      messageLength: this.self.message.length,
      createdAt: this.dateToString(this.self.createdAt),
      updatedAt: this.dateToString(this.self.updatedAt),
      deletedAt: this.dateToString(this.self.deletedAt),
      deletedBy: this.self.deletedBy,
      type: this.self.type,
      isModerator: this.self.isModerator,
    }
  }
}
