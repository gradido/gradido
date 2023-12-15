import { User } from '@entity/User'

import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { UserRepository } from '@/data/User.repository'
import { RegisterAddressLoggingView } from '@/logging/RegisterAddressLogging.view'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'

export class ConfirmUserRole extends AbstractConfirm {
  private user: User | null
  public constructor(
    confirmedTransactionRole: ConfirmedTransactionRole,
    confirmTransactionsContext: ConfirmTransactionsContext,
    private registerAddress: RegisterAddress,
  ) {
    super(confirmedTransactionRole, confirmTransactionsContext)
  }

  // confirm if user exist or create new user if user not exist
  public async confirm(): Promise<void> {
    const transaction = this.confirmedTransactionRole.getTransaction()
    // was user already loaded together with transaction?
    if (transaction.signingAccount && transaction.signingAccount.user) {
      this.user = transaction.signingAccount.user
    } else {
      // try to find user in db
      this.user = await UserRepository.findByPublicKeyWithAccount(
        this.registerAddress.userPubkey,
        1,
      )
    }
    if (this.user) {
      this.user.confirmedAt = transaction.confirmedAt
    } else {
      throw new LogError('missing user', new RegisterAddressLoggingView(this.registerAddress))
    }
  }

  public getUser(): User {
    if (!this.user) {
      throw new LogError('missing user')
    }
    return this.user
  }
}
