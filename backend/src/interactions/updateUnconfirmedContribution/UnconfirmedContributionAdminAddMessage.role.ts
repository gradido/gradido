import { Contribution, ContributionStatus, User } from 'database'

import { RIGHTS } from '@/auth/RIGHTS'
import { Role } from '@/auth/Role'
import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'

/**
 * This role will be used for Moderators and Admins which want to comment a contribution
 * Admins and Moderators are currently not allowed to comment her own contributions with the admin/moderator role
 */
export class UnconfirmedContributionAdminAddMessageRole extends AbstractUnconfirmedContributionRole {
  public constructor(
    contribution: Contribution,
    private updateData: ContributionMessageArgs,
  ) {
    super(contribution, contribution.amount, contribution.contributionDate)
    this.logger.debug('use UnconfirmedContributionAdminAddMessageRole')
  }

  protected update(): void {
    let newStatus = this.self.contributionStatus
    // change status (does not apply to moderator messages)
    if (this.updateData.messageType !== ContributionMessageType.MODERATOR) {
      newStatus = ContributionStatus.IN_PROGRESS
    }
    const resubmissionDate: Date | null = this.updateData.resubmissionAt
      ? new Date(this.updateData.resubmissionAt)
      : null
    if (
      this.self.contributionStatus !== newStatus ||
      this.self.resubmissionAt !== resubmissionDate
    ) {
      this.self.contributionStatus = newStatus
      this.self.resubmissionAt = resubmissionDate
    } else {
      this.changed = false
    }
  }

  protected checkAuthorization(user: User, role: Role): AbstractUnconfirmedContributionRole {
    if (!role.hasRight(RIGHTS.ADMIN_CREATE_CONTRIBUTION_MESSAGE)) {
      throw new LogError('missing right ADMIN_CREATE_CONTRIBUTION_MESSAGE for user', user.id)
    }

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

  public createContributionMessage(): ContributionMessageBuilder | undefined {
    const builder = super.createContributionMessage()
    if (builder) {
      return builder
        .setIsModerator(true)
        .setMessageAndType(this.updateData.message, this.updateData.messageType)
    }
  }
}
