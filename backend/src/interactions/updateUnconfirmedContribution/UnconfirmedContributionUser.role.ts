import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'

import { ContributionArgs } from '@/graphql/arg/ContributionArgs'
import { ContributionStatus } from '@/graphql/enum/ContributionStatus'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'

export class UnconfirmedContributionUserRole extends AbstractUnconfirmedContributionRole {
  public constructor(contribution: Contribution, private updateData: ContributionArgs) {
    super(contribution, updateData.amount, new Date(updateData.creationDate))
  }

  protected update(): void {
    this.self.amount = this.updateData.amount
    this.self.memo = this.updateData.memo
    this.self.contributionDate = new Date(this.updateData.creationDate)
    this.self.contributionStatus = ContributionStatus.PENDING
    this.self.updatedAt = new Date()
    // null because updated by user them self
    this.self.updatedBy = null
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
    // if a contribution was created from a moderator, user cannot edit it
    // TODO: rethink
    if (this.self.moderatorId) {
      throw new LogError('Cannot update contribution of moderator', this.self, user.id)
    }
    return this
  }

  protected async validate(clientTimezoneOffset: number): Promise<void> {
    await super.validate(clientTimezoneOffset)
    // creation date is currently not changeable
    if (
      this.self.memo === this.updateData.memo &&
      this.self.amount === this.updatedAmount &&
      this.self.contributionDate.getTime() === new Date(this.updatedCreationDate).getTime()
    ) {
      throw new LogError("the contribution wasn't changed at all")
    }
  }
}
