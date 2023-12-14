import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

import { GradidoCreation } from '@/data/proto/3_3/GradidoCreation'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private creationTransaction: GradidoCreation) {
    super(transaction)
  }

  public alreadyLoaded(): boolean {
    return this.self.recipientAccount !== undefined
  }

  public getAccountPublicKeys(): Buffer[] {
    return [this.creationTransaction.recipient.pubkey]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    throw new LogError(
      'cannot create account for creation transaction, need RegisterAddress for this',
    )
  }
}
