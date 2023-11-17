import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'

import { RIGHTS } from '@/auth/RIGHTS'
import { Role } from '@/auth/Role'
import { AdminUpdateContributionArgs } from '@/graphql/arg/AdminUpdateContributionArgs'
import { ContributionStatus } from '@/graphql/enum/ContributionStatus'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'

export class UnconfirmedContributionAdminRole extends AbstractUnconfirmedContributionRole {
  public constructor(
    contribution: Contribution,
    private updateData: AdminUpdateContributionArgs,
    private moderator: User,
  ) {
    super(
      contribution,
      updateData.amount ?? contribution.amount,
      updateData.creationDate ? new Date(updateData.creationDate) : contribution.contributionDate,
    )
  }

  protected update(): void {
    this.self.amount = this.updatedAmount
    this.self.memo = this.updateData.memo ?? this.self.memo
    this.self.contributionDate = this.updatedCreationDate
    this.self.contributionStatus = ContributionStatus.PENDING
    this.self.updatedAt = new Date()
    this.self.updatedBy = this.moderator.id
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected checkAuthorization(user: User, role: Role): AbstractUnconfirmedContributionRole {
    if (
      !role.hasRight(RIGHTS.MODERATOR_UPDATE_CONTRIBUTION_MEMO) &&
      this.self.moderatorId === null
    ) {
      throw new LogError('An admin is not allowed to update an user contribution')
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
