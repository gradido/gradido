import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'

import { AbstractCalculateBalanceRole } from './AbstractCalculateBalance.role'

export class CalculateBalanceRecipientRole extends AbstractCalculateBalanceRole {
  public calculate(): Decimal {
    if (!this.self.recipientAccount) {
      throw new LogError('missing recipient account')
    }
    return this.getDecayedBalance(this.self.recipientAccount)
  }
}
