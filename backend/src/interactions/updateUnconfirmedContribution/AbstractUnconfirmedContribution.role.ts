import { Contribution, User } from 'database'
import { Decimal } from 'decimal.js-light'

import { ContributionStatus } from '@enum/ContributionStatus' 
import { Role } from '@/auth/Role'
import { ContributionLogic } from '@/data/Contribution.logic'
import { ContributionMessageBuilder } from '@/data/ContributionMessage.builder'
import { LogError } from '@/server/LogError'
import { Context, getClientTimezoneOffset } from '@/server/context'
import { Logger, getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

export abstract class AbstractUnconfirmedContributionRole {
  private availableCreationSums?: Decimal[]
  protected changed = true
  private currentStep = 0
  protected logger: Logger

  public constructor(
    protected self: Contribution,
    protected updatedAmount: Decimal,
    protected updatedCreationDate: Date,
  ) {
    if (self.confirmedAt || self.deniedAt) {
      throw new LogError("this contribution isn't unconfirmed!")
    }
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.interactions.updateUnconfirmedContribution`)
    this.logger.addContext('contribution', this.self.id)
  }

  public isChanged(): boolean {
    return this.changed
  }

  // steps which return void throw on each error
  // first, check if it can be updated
  protected abstract checkAuthorization(user: User, role: Role): void
  // second, check if contribution is still valid after update
  protected async validate(clientTimezoneOffset: number): Promise<void> {
    // TODO: refactor frontend and remove this restriction
    if (this.self.contributionDate.getMonth() !== this.updatedCreationDate.getMonth()) {
      throw new LogError('Month of contribution can not be changed')
    }

    if ((this.self.contributionStatus as ContributionStatus) === ContributionStatus.CONFIRMED) {
      throw new LogError('the contribution is already confirmed, cannot be changed anymore')
    }

    const contributionLogic = new ContributionLogic(this.self)
    this.availableCreationSums = await contributionLogic.getAvailableCreationSums(
      clientTimezoneOffset,
      true,
    )
    contributionLogic.checkAvailableCreationSumsNotExceeded(
      this.updatedAmount,
      this.updatedCreationDate,
      clientTimezoneOffset,
    )
  }

  // third, actually update entity
  protected abstract update(): void

  protected wasUpdateAlreadyCalled(): boolean {
    return this.currentStep > 3
  }

  // call all steps in order
  public async checkAndUpdate(context: Context): Promise<void> {
    if (!context.user || !context.role) {
      throw new LogError('missing user or role on context')
    }
    this.currentStep = 1
    this.checkAuthorization(context.user, context.role)
    this.currentStep = 2
    await this.validate(getClientTimezoneOffset(context))
    this.currentStep = 3
    this.update()
    this.currentStep = 4
  }

  public createContributionMessage(): ContributionMessageBuilder | undefined {
    // must be called before call at update
    if (this.wasUpdateAlreadyCalled()) {
      throw new LogError('please call before call of checkAndUpdate')
    }
    const contributionMessageBuilder = new ContributionMessageBuilder()
    return contributionMessageBuilder.setParentContribution(this.self).setHistoryType(this.self)
  }

  public getAvailableCreationSums(): Decimal[] {
    if (!this.availableCreationSums) {
      throw new LogError('availableCreationSums is empty, please call validate before!')
    }
    return this.availableCreationSums
  }

  public isCreatedFromUser(): boolean {
    return !this.self.moderatorId
  }
}
