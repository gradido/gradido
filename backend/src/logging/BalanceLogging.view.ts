import { AbstractLoggingView } from '@logging/AbstractLogging.view'

import { Balance } from '@/graphql/model/Balance'

export class BalanceLoggingView extends AbstractLoggingView {
  public constructor(private self: Balance) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      balance: this.decimalToString(this.self.balance),
      balanceGDT: this.self.balanceGDT,
      count: this.self.count,
      linkCount: this.self.linkCount,
    }
  }
}
