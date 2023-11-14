import { Contribution } from '@entity/Contribution'
import { ContributionMessage } from '@entity/ContributionMessage'
import { Decimal } from 'decimal.js-light'

import { AdminUpdateContributionArgs } from '@arg/AdminUpdateContributionArgs'
import { ContributionArgs } from '@arg/ContributionArgs'

import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

import { UnconfirmedContributionRole } from './UnconfirmedContribution.role'
import { UnconfirmedContributionAdminRole } from './UnconfirmedContributionAdmin.role'
import { UnconfirmedContributionUserRole } from './UnconfirmedContributionUser.role'

export class UpdateUnconfirmedContributionContext {
  /**
   *
   * @param id contribution id for update
   * @param input ContributionArgs or AdminUpdateContributionArgs depending on calling resolver function
   * @param context
   */
  public constructor(
    private id: number,
    private input: ContributionArgs | AdminUpdateContributionArgs,
    private context: Context,
  ) {
    if (!context.role || !context.user) {
      throw new LogError("context didn't contain role or user")
    }
  }

  public async run(): Promise<{
    contribution: Contribution
    contributionMessage: ContributionMessage
    availableCreationSums: Decimal[],
    createdByUserChangedByModerator: boolean
  }> {
    let createdByUserChangedByModerator = false
    if (!this.context.role || !this.context.user) {
      throw new LogError("context didn't contain role or user")
    }
    const contributionToUpdate = await Contribution.findOne({
      where: { id: this.id },
    })
    if (!contributionToUpdate) {
      throw new LogError('Contribution not found', this.id)
    }
    const contributionMessageBuilder = new ContributionMessageBuilder()
    contributionMessageBuilder
      .setParentContribution(contributionToUpdate)
      .setHistoryType(contributionToUpdate)
      .setUser(this.context.user)

    // choose correct role
    let unconfirmedContributionRole: UnconfirmedContributionRole | null = null
    if (this.input instanceof ContributionArgs) {
      unconfirmedContributionRole = new UnconfirmedContributionUserRole(
        contributionToUpdate,
        this.input,
      )
      contributionMessageBuilder.setIsModerator(false)
    } else if (this.input instanceof AdminUpdateContributionArgs) {
      unconfirmedContributionRole = new UnconfirmedContributionAdminRole(
        contributionToUpdate,
        this.input,
        this.context.user,
      )
      if (unconfirmedContributionRole.isCreatedFromUser()) {
        createdByUserChangedByModerator = true
      }
      contributionMessageBuilder.setIsModerator(true)
    }
    if (!unconfirmedContributionRole) {
      throw new LogError("don't recognize input type, maybe not implemented yet?")
    }
    // run steps
    // all possible cases not to be true are thrown in the next function
    await unconfirmedContributionRole.checkAndUpdate(this.context)

    return {
      contribution: contributionToUpdate,
      contributionMessage: contributionMessageBuilder.build(),
      availableCreationSums: unconfirmedContributionRole.getAvailableCreationSums(),
      createdByUserChangedByModerator
    }
  }
}
