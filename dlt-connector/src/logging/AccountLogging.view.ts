import { Account } from '@entity/Account'

import { getAddressTypeEnumValue } from '@/data/proto/3_3/enum/AddressType'

import { AbstractLoggingView } from './AbstractLogging.view'
import { UserLoggingView } from './UserLogging.view'

export class AccountLoggingView extends AbstractLoggingView {
  public constructor(private account: Account) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.account.id,
      user: this.account.user ? new UserLoggingView(this.account.user).toJSON() : null,
      derivationIndex: this.account.derivationIndex,
      derive2pubkey: this.account.derive2Pubkey.toString(this.bufferStringFormat),
      type: getAddressTypeEnumValue(this.account.type),
      createdAt: this.dateToString(this.account.createdAt),
      confirmedAt: this.dateToString(this.account.confirmedAt),
      balanceConfirmedAt: this.decimalToString(this.account.balanceConfirmedAt),
      balanceConfirmedAtDate: this.dateToString(this.account.balanceConfirmedAtDate),
      balanceCreatedAt: this.decimalToString(this.account.balanceCreatedAt),
      balanceCreatedAtDate: this.dateToString(this.account.balanceConfirmedAtDate),
    }
  }
}
