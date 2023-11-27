import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'

import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'
import { ContributionStatus } from '@/graphql/enum/ContributionStatus'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'

export class UnconfirmedContributionAdminAddMessageRole extends AbstractUnconfirmedContributionRole {
  public constructor(contribution: Contribution, private updateData: ContributionMessageArgs) {
    super(contribution, contribution.amount, contribution.contributionDate)
  }

  protected update(): void {
    let newStatus = this.self.contributionStatus
    // change status (does not apply to moderator messages)
    if (this.updateData.messageType !== ContributionMessageType.MODERATOR) {
      newStatus = ContributionStatus.IN_PROGRESS
    }
    if (this.self.contributionStatus !== newStatus || this.self.resubmissionAt != null) {
      this.self.contributionStatus = newStatus
      this.self.resubmissionAt = null
    } else {
      this.changed = false
    }
  }

  protected checkAuthorization(user: User): AbstractUnconfirmedContributionRole {
    // TODO: think if there are cases in which admin comment his own contribution
    if (
      this.self.userId === user.id &&
      this.updateData.messageType === ContributionMessageType.MODERATOR
    ) {
      throw new LogError(
        'Moderator|Admin can not make a moderator comment on his own contribution',
        this.self.id,
      )
    }
    return this
  }

  protected async validate(clientTimezoneOffset: number): Promise<void> {
    await super.validate(clientTimezoneOffset)
  }

  public createContributionMessage(): ContributionMessageBuilder {
    return super
      .createContributionMessage()
      .setIsModerator(true)
      .setMessageAndType(this.updateData.message, this.updateData.messageType)
  }
}
