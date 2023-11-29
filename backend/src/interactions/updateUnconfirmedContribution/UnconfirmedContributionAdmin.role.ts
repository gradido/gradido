import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'

import { RIGHTS } from '@/auth/RIGHTS'
import { Role } from '@/auth/Role'
import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
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

  /**
   *
   * @returns true if memo, amount or creation date are changed
   */
  private isContributionChanging(): boolean {
    if (this.wasUpdateAlreadyCalled()) {
      throw new LogError('please call only before calling checkAndUpdate')
    }
    return (
      (this.updateData.memo && this.self.memo !== this.updateData.memo) ||
      (this.updatedAmount && this.self.amount !== this.updatedAmount) ||
      +this.self.contributionDate !== +this.updatedCreationDate
    )
  }

  protected update(): void {
    if (this.isContributionChanging()) {
      // set update fields only if actual contribution was changed, not only the status or resubmission date
      this.self.updatedAt = new Date()
      this.self.updatedBy = this.moderator.id
      this.self.contributionStatus = ContributionStatus.PENDING
    }
    this.self.amount = this.updatedAmount
    this.self.memo = this.updateData.memo ?? this.self.memo
    this.self.contributionDate = this.updatedCreationDate
    if (this.updateData.resubmissionAt) {
      this.self.resubmissionAt = new Date(this.updateData.resubmissionAt)
    } else {
      this.self.resubmissionAt = null
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected checkAuthorization(user: User, role: Role): AbstractUnconfirmedContributionRole {
    if (
      !role.hasRight(RIGHTS.MODERATOR_UPDATE_CONTRIBUTION_MEMO) &&
      this.self.moderatorId === null
    ) {
      throw new LogError("The Moderator hasn't the right MODERATOR_UPDATE_CONTRIBUTION_MEMO")
    }
    return this
  }

  protected async validate(clientTimezoneOffset: number): Promise<void> {
    await super.validate(clientTimezoneOffset)

    const newResubmissionDate = this.updateData.resubmissionAt
      ? new Date(this.updateData.resubmissionAt)
      : null

    const resubmissionNotChanged =
      this.self.resubmissionAt !== null &&
      newResubmissionDate !== null &&
      +this.self.resubmissionAt === +newResubmissionDate

    // creation date is currently not changeable
    if (
      !this.isContributionChanging() &&
      ((this.self.resubmissionAt === null && newResubmissionDate === null) ||
        resubmissionNotChanged)
    ) {
      throw new LogError("the contribution wasn't changed at all")
    }
  }

  public createContributionMessage(): ContributionMessageBuilder | undefined {
    if (!this.isContributionChanging()) {
      return
    }
    const builder = super.createContributionMessage()
    if (builder) {
      return builder.setIsModerator(true)
    }
  }
}
