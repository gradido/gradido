import { Account } from '@entity/Account'

import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class AccountLoggingView extends AbstractLoggingView {
  public constructor(private account: Account) {
    super()
  }

  public toJSON() {
    return {
      id: this.account.id,
      user: this.account.user ? new UserLoggingView(this.account.user).toJSON() : null,
      derivationIndex: this.account.derivationIndex,
      derive2pubkey: this.account.derive2Pubkey.toString(this.bufferStringFormat),
      type: getEnumValue(AddressType, this.account.type),
      createdAt: this.dateToString(this.account.createdAt),
      confirmedAt: this.dateToString(this.account.confirmedAt),
      balanceOnConfirmation: this.decimalToString(this.account.balanceOnConfirmation),
      balanceConfirmedAt: this.dateToString(this.account.balanceConfirmedAt),
      balanceOnCreation: this.decimalToString(this.account.balanceOnCreation),
      balanceCreatedAt: this.dateToString(this.account.balanceCreatedAt),
    }
  }
}
