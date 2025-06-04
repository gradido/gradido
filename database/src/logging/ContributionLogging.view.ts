import { Contribution } from '@/entity'
import { AbstractLoggingView } from './AbstractLogging.view'
import { ContributionMessageLoggingView } from './ContributionMessageLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class ContributionLoggingView extends AbstractLoggingView {
  public constructor(private self: Contribution) {
    super()
  }

  public toJSON(): any {
    return {
      id: this.self.id,
      user: this.self.user
        ? new UserLoggingView(this.self.user).toJSON()
        : { id: this.self.userId },
      createdAt: this.dateToString(this.self.createdAt),
      resubmissionAt: this.dateToString(this.self.resubmissionAt),
      contributionDate: this.dateToString(this.self.contributionDate),
      memoLength: this.self.memo.length,
      amount: this.decimalToString(this.self.amount),
      moderatorId: this.self.moderatorId,
      contributionLinkId: this.self.contributionLinkId,
      confirmedBy: this.self.confirmedBy,
      confirmedAt: this.dateToString(this.self.confirmedAt),
      deniedBy: this.self.deniedBy,
      deniedAt: this.dateToString(this.self.deniedAt),
      contributionType: this.self.contributionType,
      contributionStatus: this.self.contributionStatus,
      transactionId: this.self.transactionId,
      updatedAt: this.dateToString(this.self.updatedAt),
      updatedBy: this.self.updatedBy,
      deletedAt: this.dateToString(this.self.deletedAt),
      deletedBy: this.self.deletedBy,
      messages: this.self.messages
        ? this.self.messages.map((message) => new ContributionMessageLoggingView(message).toJSON())
        : undefined,
      transaction: this.self.transaction
        ? new TransactionLoggingView(this.self.transaction).toJSON()
        : { id: this.self.transactionId },
    }
  }
}
