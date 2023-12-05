import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ConfirmTransactionsContext } from './ConfirmTransactions.context'
import { ConfirmUserRole } from './ConfirmUser.role'
import { Account } from '@entity/Account'
import { AccountFactory } from '@/data/Account.factory'

export class ConfirmAccountRole extends AbstractConfirm {
  public constructor(
    confirmedTransactionRole: ConfirmedTransactionRole,
    confirmTransactionsContext: ConfirmTransactionsContext,
    private registerAddress: RegisterAddress,
  ) {
    super(confirmedTransactionRole, confirmTransactionsContext)
  }

  // called on register address transaction so maybe we must create the account and the user for it
  public async confirm(): Promise<void> {
    let publicKey: Buffer | undefined
    const transaction = this.confirmedTransactionRole.getTransaction()

    if (this.registerAddress.userPubkey && this.registerAddress.userPubkey.length === 32) {
      if (this.registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
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
        const user = confirmUser.getUser()
        // was account already loaded with transaction?
        let account: Account | undefined = transaction.signingAccount
        // was account already loaded with user?
        if (!account && user && user.accounts?.length === 1) {
          account = user.accounts[0]
        }
        // we create a new one
        if (!account) {
          AccountFactory.createFromTransaction(transaction, this.registerAddress)
        }
    }
    if (this.registerAddress.accountPubkey && this.registerAddress.accountPubkey.length === 32) {
      publicKey = Buffer.from(this.registerAddress.accountPubkey)
    }
    if (!publicKey) {
      throw new LogError("invalid Register Address, could't find a public key")
    }
    const result = await getDataSource()
      .createQueryBuilder()
      .update(Account)
      .set({ confirmedAt })
      .where('derive2Pubkey = :publicKey', { publicKey })
      .execute()
    if (result.affected && result.affected > 1) {
      throw new LogError('more than one account matched by publicKey: %s', publicKey.toString('hex'))
    }
    return result.affected === 1
  }
}
