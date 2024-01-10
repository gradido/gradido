import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

import { AccountFactory } from '@/data/Account.factory'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { UserFactory } from '@/data/User.factory'
import { UserRepository } from '@/data/User.repository'
import { AccountLoggingView } from '@/logging/AccountLogging.view'
import { logger } from '@/logging/logger'
import { RegisterAddressLoggingView } from '@/logging/RegisterAddressLogging.view'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private registerAddress: RegisterAddress) {
    super(transaction)
  }

  public alreadyLoaded(): boolean {
    return this.self.signingAccount !== undefined
  }

  public getAccountPublicKeys(): Buffer[] {
    return [this.registerAddress.accountPubkey]
  }

  protected addAccountToTransaction(foundedAccount: Account): void {
    if (this.keyCompare(foundedAccount.derive2Pubkey, this.registerAddress.accountPubkey)) {
      this.self.signingAccount = foundedAccount
      this.self.signingAccountId = foundedAccount.id
    } else {
      throw new LogError("account don't belong to register address")
    }
  }

  protected async createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    if (missingAccountPublicKey !== this.registerAddress.accountPubkey) {
      throw new LogError('unknown public key')
    }
    const account = AccountFactory.createFromTransaction(this.self, this.registerAddress)
    if (this.registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
      let user = await UserRepository.findByPublicKey(this.registerAddress.userPubkey)
      if (!user) {
        // no user found, create new one
        user = UserFactory.createFromTransaction(this.self, this.registerAddress)
      }
      // will be stored together with account (cascading insert)
      account.user = user
    }
    this.self.signingAccount = account
    logger.debug('create account', {
      registerAddress: new RegisterAddressLoggingView(this.registerAddress),
      account: new AccountLoggingView(account),
    })
    return account
  }
}
