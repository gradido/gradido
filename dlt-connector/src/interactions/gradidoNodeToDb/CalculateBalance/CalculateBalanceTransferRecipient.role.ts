import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'

import { CalculateBalanceRecipientRole } from './CalculateBalanceRecipient.role'

export class CalculateBalanceTransferRecipientRole extends CalculateBalanceRecipientRole {
  public calculate(): Decimal {
    if (!this.self.amount) {
      throw new LogError('amount is missing')
    }
    return super.calculate().plus(this.self.amount.toString())
  }
}
