import { Account } from '@entity/Account'
import { Decimal } from 'decimal.js-light'

import { calculateDecay } from '@/utils/decay'

export class AccountLogic {
  // eslint-disable-next-line no-useless-constructor
  constructor(private account: Account) {}

  public calculateBalanceCreatedAt(newCreateAtDate: Date, amount: Decimal): Decimal {
    const decay = calculateDecay(
      this.account.balanceCreatedAt,
      this.account.balanceCreatedAtDate,
      newCreateAtDate,
    )
    return decay.balance.add(amount)
  }
}
