import { Account } from '@entity/Account'
import { addressTypeToString } from 'gradido-blockchain-js'

import { AccountType } from '@/graphql/enum/AccountType'
import { accountTypeToAddressType } from '@/utils/typeConverter'

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
      derive2Pubkey: this.account.derive2Pubkey.toString(this.bufferStringFormat),
      type: addressTypeToString(
        accountTypeToAddressType(this.account.type as unknown as AccountType),
      ),
      createdAt: this.dateToString(this.account.createdAt),
      confirmedAt: this.dateToString(this.account.confirmedAt),
      balanceOnConfirmation: this.decimalToString(this.account.balanceOnConfirmation),
      balanceConfirmedAt: this.dateToString(this.account.balanceConfirmedAt),
      balanceOnCreation: this.decimalToString(this.account.balanceOnCreation),
      balanceCreatedAt: this.dateToString(this.account.balanceCreatedAt),
    }
  }
}
