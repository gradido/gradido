import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'

import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { ContributionStatus } from '@/graphql/enum/ContributionStatus'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'

export class UnconfirmedContributionUserAddMessageRole extends AbstractUnconfirmedContributionRole {
  public constructor(contribution: Contribution, private updateData: ContributionMessageArgs) {
    super(contribution, contribution.amount, contribution.contributionDate)
  }

  protected update(): void {
    if (
      this.self.contributionStatus === ContributionStatus.IN_PROGRESS ||
      this.self.resubmissionAt !== null
    ) {
      this.self.contributionStatus = ContributionStatus.PENDING
      this.self.resubmissionAt = null
    } else {
      this.changed = false
    }
  }

  protected checkAuthorization(user: User): AbstractUnconfirmedContributionRole {
    if (this.self.userId !== user.id) {
      throw new LogError('Can not update contribution of another user', this.self, user.id)
    }
    // only admins and moderators can update it when status is other than progress or pending
    if (
      this.self.contributionStatus !== ContributionStatus.IN_PROGRESS &&
      this.self.contributionStatus !== ContributionStatus.PENDING
    ) {
      throw new LogError(
        'Contribution can not be updated due to status',
        this.self.contributionStatus,
      )
    }
    return this
  }

  public createContributionMessage(): ContributionMessageBuilder {
    return super
      .createContributionMessage()
      .setIsModerator(false)
      .setDialogType(this.updateData.message)
  }
}
