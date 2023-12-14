import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

import { GradidoTransfer } from '@/data/proto/3_3/GradidoTransfer'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class TransferTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private transferTransaction: GradidoTransfer) {
    super(transaction)
  }

  public alreadyLoaded(): boolean {
    return this.self.signingAccount !== undefined && this.self.recipientAccount !== undefined
  }

  public getAccountPublicKeys(): Buffer[] {
    return [this.transferTransaction.recipient, this.transferTransaction.sender.pubkey]
  }

  protected addAccountToTransaction(foundedAccount: Account): void {
    if (foundedAccount.derive2Pubkey.equals(this.transferTransaction.recipient)) {
      this.self.recipientAccount = foundedAccount
      this.self.recipientAccountId = foundedAccount.id
    } else if (foundedAccount.derive2Pubkey.equals(this.transferTransaction.sender.pubkey)) {
      this.self.signingAccount = foundedAccount
      this.self.signingAccountId = foundedAccount.id
    } else {
      throw new LogError("account don't belong to transfer transaction")
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    throw new LogError(
      'cannot create account for transfer transaction, need RegisterAddress for this',
    )
  }
}
