import { AdminUpdateContributionArgs } from '@arg/AdminUpdateContributionArgs'
import { ContributionArgs } from '@arg/ContributionArgs'
import { Contribution, ContributionMessage } from 'database'
import { Decimal } from 'decimal.js-light'
import { EntityManager, FindOneOptions, FindOptionsRelations } from 'typeorm'

import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

import { AbstractUnconfirmedContributionRole } from './AbstractUnconfirmedContribution.role'
import { UnconfirmedContributionAdminRole } from './UnconfirmedContributionAdmin.role'
import { UnconfirmedContributionAdminAddMessageRole } from './UnconfirmedContributionAdminAddMessage.role'
import { UnconfirmedContributionUserRole } from './UnconfirmedContributionUser.role'
import { UnconfirmedContributionUserAddMessageRole } from './UnconfirmedContributionUserAddMessage.role'

export class UpdateUnconfirmedContributionContext {
  private oldMemoText: string
  /**
   *
   * @param id contribution id for update
   * @param input ContributionArgs or AdminUpdateContributionArgs depending on calling resolver function
   * @param context
   */
  public constructor(
    private id: number,
    private input: ContributionArgs | AdminUpdateContributionArgs | ContributionMessageArgs,
    private context: Context,
  ) {
    if (!context.role || !context.user) {
      throw new LogError("context didn't contain role or user")
    }
  }

  public async run(
    transactionEntityManager?: EntityManager,
    relations?: FindOptionsRelations<Contribution>,
  ): Promise<{
    contribution: Contribution
    contributionMessage: ContributionMessage | undefined
    availableCreationSums: Decimal[]
    createdByUserChangedByModerator: boolean
    contributionChanged: boolean
  }> {
    let createdByUserChangedByModerator = false
    if (!this.context.role || !this.context.user) {
      throw new LogError("context didn't contain role or user")
    }
    const options: FindOneOptions<Contribution> = { where: { id: this.id }, relations }
    let contributionToUpdate: Contribution | null
    if (transactionEntityManager) {
      contributionToUpdate = await transactionEntityManager.findOne(Contribution, options)
    } else {
      contributionToUpdate = await Contribution.findOne(options)
    }
    if (!contributionToUpdate) {
      throw new LogError('Contribution not found', this.id)
    }
    this.oldMemoText = contributionToUpdate.memo

    // choose correct role
    let unconfirmedContributionRole: AbstractUnconfirmedContributionRole | null = null
    if (this.input instanceof ContributionArgs) {
      unconfirmedContributionRole = new UnconfirmedContributionUserRole(
        contributionToUpdate,
        this.input,
      )
    } else if (this.input instanceof AdminUpdateContributionArgs) {
      unconfirmedContributionRole = new UnconfirmedContributionAdminRole(
        contributionToUpdate,
        this.input,
        this.context.user,
      )

      if (unconfirmedContributionRole.isCreatedFromUser()) {
        createdByUserChangedByModerator = true
      }
    } else if (this.input instanceof ContributionMessageArgs) {
      if (contributionToUpdate.userId !== this.context.user.id) {
        unconfirmedContributionRole = new UnconfirmedContributionAdminAddMessageRole(
          contributionToUpdate,
          this.input,
        )
      } else {
        unconfirmedContributionRole = new UnconfirmedContributionUserAddMessageRole(
          contributionToUpdate,
          this.input,
        )
      }
    }
    if (!unconfirmedContributionRole) {
      throw new LogError("don't recognize input type, maybe not implemented yet?")
    }

    const contributionMessageBuilder = unconfirmedContributionRole.createContributionMessage()
    if (contributionMessageBuilder) {
      contributionMessageBuilder.setUser(this.context.user)
    }
    // run steps
    // all possible cases not to be true are thrown in the next function
    await unconfirmedContributionRole.checkAndUpdate(this.context)

    return {
      contribution: contributionToUpdate,
      contributionMessage: contributionMessageBuilder
        ? contributionMessageBuilder.build()
        : undefined,
      availableCreationSums: unconfirmedContributionRole.getAvailableCreationSums(),
      createdByUserChangedByModerator,
      contributionChanged: unconfirmedContributionRole.isChanged(),
    }
  }

  public getOldMemo(): string {
    return this.oldMemoText
  }
}
