import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'

import { CalculateBalanceSenderRole } from './CalculateBalanceSender.role'

export class CalculateBalanceTransferSenderRole extends CalculateBalanceSenderRole {
  public calculate(): Decimal {
    if (!this.self.amount) {
      throw new LogError('amount is missing')
    }
    return super.calculate().minus(this.self.amount.toString())
  }
}
