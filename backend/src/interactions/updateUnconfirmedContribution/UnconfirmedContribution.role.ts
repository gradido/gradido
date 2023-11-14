import { Contribution } from '@entity/Contribution'
import { User } from '@entity/User'
import { Decimal } from 'decimal.js-light'

import { Role } from '@/auth/Role'
import { ContributionLogic } from '@/data/Contribution.logic'
import { Context, getClientTimezoneOffset } from '@/server/context'
import { LogError } from '@/server/LogError'

export abstract class UnconfirmedContributionRole {
  private availableCreationSums?: Decimal[]

  public constructor(
    protected self: Contribution,
    protected updatedAmount: Decimal,
    protected updatedCreationDate: Date,
  ) {
    if (self.confirmedAt || self.deniedAt) {
      throw new LogError("this contribution isn't unconfirmed!")
    }
  }

  // steps which return void throw on each error
  // first, check if it can be updated
  protected abstract checkAuthorization(user: User, role: Role): void
  // second, check if contribution is still valid after update
  protected async validate(clientTimezoneOffset: number): Promise<void> {
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

  // call all steps in order
  public async checkAndUpdate(context: Context): Promise<void> {
    if (!context.user || !context.role) {
      throw new LogError('missing user or role on context')
    }
    this.checkAuthorization(context.user, context.role)
    await this.validate(getClientTimezoneOffset(context))
    this.update()
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
