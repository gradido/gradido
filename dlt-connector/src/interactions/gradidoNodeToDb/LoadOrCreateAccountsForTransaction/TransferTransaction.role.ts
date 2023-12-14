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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    throw new LogError(
      'cannot create account for transfer transaction, need RegisterAddress for this',
    )
  }
}
