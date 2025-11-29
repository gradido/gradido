import { Contribution, User } from 'database'

import { ContributionStatus } from '@enum/ContributionStatus' 
import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'

/**
 * This role will be used if a User comment his contribution, for example as answer to a moderator question
 * independent from there role, because the own contribution can only be commented in user role
 */
export class UnconfirmedContributionUserAddMessageRole extends AbstractUnconfirmedContributionRole {
  public constructor(
    contribution: Contribution,
    private updateData: ContributionMessageArgs,
  ) {
    super(contribution, contribution.amount, contribution.contributionDate)
    this.logger.debug('use UnconfirmedContributionUserAddMessageRole')
  }

  protected update(): void {
    if (
      (this.self.contributionStatus as ContributionStatus) === ContributionStatus.IN_PROGRESS ||
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
    // but we are in the user add message role.. we are currently not admin or moderator
    const contributionStatus = this.self.contributionStatus as ContributionStatus
    if (
      contributionStatus !== ContributionStatus.IN_PROGRESS &&
      contributionStatus !== ContributionStatus.PENDING
    ) {
      throw new LogError(
        'Contribution can not be updated due to status',
        this.self.contributionStatus,
      )
    }
    if (this.updateData.messageType !== ContributionMessageType.DIALOG) {
      throw new LogError('unexpected contribution message type, only dialog is allowed for user')
    }
    return this
  }

  public createContributionMessage(): ContributionMessageBuilder | undefined {
    const builder = super.createContributionMessage()
    if (builder) {
      return builder.setIsModerator(false).setDialogType(this.updateData.message)
    }
  }
}
