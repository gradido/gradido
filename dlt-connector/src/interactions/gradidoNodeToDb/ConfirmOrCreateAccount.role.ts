import { Account } from '@entity/Account'
import { User } from '@entity/User'

import { AccountFactory } from '@/data/Account.factory'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmOrCreateUserRole } from './ConfirmOrCreateUser.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'

export class ConfirmOrCreateAccountRole extends AbstractConfirm {
  public constructor(
    confirmedTransactionRole: ConfirmedTransactionRole,
    confirmTransactionsContext: ConfirmTransactionsContext,
    private registerAddress: RegisterAddress,
  ) {
    super(confirmedTransactionRole, confirmTransactionsContext)
  }

  /**
   * load user from transaction, db or create if not exist
   * @returns {User}
   */
  private async confirmOrCreateUser(): Promise<User> {
    const confirmUser = new ConfirmOrCreateUserRole(
      this.confirmedTransactionRole,
      this.confirmTransactionsContext,
      this.registerAddress,
    )
    try {
      await confirmUser.confirm()
    } catch (error) {
      throw new LogError("couldn't confirm User", error)
    }
    return confirmUser.getUser()
  }

  // called on register address transaction so maybe we must create the account and the user for it
  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()
    // was account already loaded with transaction?
    let account: Account | undefined = transaction.signingAccount

    if (this.registerAddress.userPubkey && this.registerAddress.userPubkey.length === 32) {
      if (this.registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
        const user = await this.confirmOrCreateUser()
        // was account already loaded with user?
        if (!account && user && user.accounts?.length === 1) {
          account = user.accounts[0]
        }
        // we create a new one
        if (!account) {
          account = AccountFactory.createFromTransaction(transaction, this.registerAddress)
        }
        account.user = user
      }
    }
    if (!account) {
      throw new LogError('Missing Account')
    }
    account.confirmedAt = transaction.confirmedAt
    transaction.signingAccount = account
    this.confirmTransactionsContext.addForSave(account)
  }
}
