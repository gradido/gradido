import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { GradidoTransactionLoggingView } from '@/logging/GradidoTransactionLogging.view'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private gradidoTransaction: GradidoTransaction) {
    super(transaction)
  }

  public alreadyLoaded(): boolean {
    return this.self.recipientAccount !== undefined
  }

  public getAccountPublicKeys(): Buffer[] {
    const creationTransaction = this.gradidoTransaction.getTransactionBody().creation
    if (!creationTransaction) {
      throw new LogError("GradidoTransaction don't contain CreationTransaction")
    }
    return [
      creationTransaction.recipient.pubkey,
      this.gradidoTransaction.getFirstSignature().pubKey,
    ]
  }

  protected addAccountToTransaction(foundedAccount: Account): void {
    const creationTransaction = this.gradidoTransaction.getTransactionBody().creation
    if (!creationTransaction) {
      throw new LogError("GradidoTransaction don't contain CreationTransaction")
    }
    if (this.keyCompare(foundedAccount.derive2Pubkey, creationTransaction.recipient.pubkey)) {
      this.self.recipientAccount = foundedAccount
      this.self.recipientAccountId = foundedAccount.id
    } else if (
      this.keyCompare(
        foundedAccount.derive2Pubkey,
        this.gradidoTransaction.getFirstSignature().pubKey,
      )
    ) {
      this.self.signingAccount = foundedAccount
      this.self.signingAccountId = foundedAccount.id
    } else {
      throw new LogError("account don't belong to creation transaction")
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    throw new LogError(
      'cannot create account for creation transaction, need RegisterAddress for this',
      {
        publicKey: Buffer.from(missingAccountPublicKey).toString('hex'),
        creationTransaction: new GradidoTransactionLoggingView(this.gradidoTransaction),
      },
    )
  }
}
