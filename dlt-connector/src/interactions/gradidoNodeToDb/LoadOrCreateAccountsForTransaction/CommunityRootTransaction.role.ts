import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

import { AccountFactory } from '@/data/Account.factory'
import { KeyPair } from '@/data/KeyPair'
import { CommunityRoot } from '@/data/proto/3_3/CommunityRoot'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CommunityRootTransactionRole extends AbstractTransactionRole {
  public constructor(transaction: Transaction, private communityRoot: CommunityRoot) {
    super(transaction)
  }

  public alreadyLoaded(): boolean {
    const community = this.self.community
    return community.aufAccount !== undefined && community.gmwAccount !== undefined
  }

  public getAccountPublicKeys(): Buffer[] {
    return [this.communityRoot.aufPubkey, this.communityRoot.gmwPubkey]
  }

  protected async createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    const community = this.self.community
    if (this.communityRoot.aufPubkey === missingAccountPublicKey) {
      const aufAccount = AccountFactory.createAufAccount(
        new KeyPair(community),
        this.self.createdAt,
      )
      community.aufAccount = aufAccount
      return aufAccount
    } else if (this.communityRoot.gmwPubkey === missingAccountPublicKey) {
      const gmwAccount = AccountFactory.createGmwAccount(
        new KeyPair(community),
        this.self.createdAt,
      )
      community.gmwAccount = gmwAccount
      return gmwAccount
    } else {
      throw new LogError('unknown public key')
    }
  }
}