import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'
import { calculateDecay } from '@/utils/decay'

import { BalanceType } from './CalculateBalance.context'

export abstract class AbstractCalculateBalanceRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: Transaction, protected type: BalanceType) {}

  public abstract calculate(): Decimal

  public getDecayedBalance(account: Account): Decimal {
    if (this.type === BalanceType.ON_CONFIRMATION) {
      if (account.balanceOnConfirmation.isZero()) {
        return new Decimal(0)
      }
      if (!account.balanceConfirmedAt) {
        throw new LogError('balance confirmedAt missing')
      }
      return calculateDecay(
        account.balanceOnConfirmation,
        account.balanceConfirmedAt,
        this.getCorrectDate(),
      ).balance
    } else if (this.type === BalanceType.ON_CREATION) {
      return calculateDecay(
        account.balanceOnCreation,
        account.balanceCreatedAt,
        this.getCorrectDate(),
      ).balance
    } else {
      throw new LogError('BalanceType not implemented yet', this.type)
    }
  }

  /**
   * @returns confirmedAt if BalanceType is ON_CONFIRMATION, else createdAt
   */
  public getCorrectDate(): Date {
    if (this.type === BalanceType.ON_CONFIRMATION) {
      if (!this.self.confirmedAt) {
        throw new LogError('confirmed at date missing')
      }
      return this.self.confirmedAt
    } else if (this.type === BalanceType.ON_CREATION) {
      return this.self.createdAt
    } else {
      throw new LogError('BalanceType not implemented yet', this.type)
    }
  }
}
