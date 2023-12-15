import { User } from '@entity/User'

import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'
import { ConfirmUserRole } from './ConfirmUser.role'

export class ConfirmAccountRole extends AbstractConfirm {
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
  private async confirmUser(): Promise<User> {
    const confirmUser = new ConfirmUserRole(
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
    const account = transaction.signingAccount
    if (!account) {
      throw new LogError('missing account for transaction', new TransactionLoggingView(transaction))
    }

    if (this.registerAddress.userPubkey && this.registerAddress.userPubkey.length === 32) {
      if (this.registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
        const user = await this.confirmUser()
        account.user = user
      }
    }
    account.confirmedAt = transaction.confirmedAt
    transaction.signingAccount = account
    this.confirmTransactionsContext.addForSave(account)
  }
}
