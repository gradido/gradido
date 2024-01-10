import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'

import { AbstractCalculateBalanceRole } from './AbstractCalculateBalance.role'

export class CalculateBalanceSenderRole extends AbstractCalculateBalanceRole {
  public calculate(): Decimal {
    if (!this.self.signingAccount) {
      throw new LogError('missing signing account')
    }
    return this.getDecayedBalance(this.self.signingAccount)
  }
}
