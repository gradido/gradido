import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

import { AccountFactory } from '@/data/Account.factory'
import { KeyPair } from '@/data/KeyPair'
import { CommunityRoot } from '@/data/proto/3_3/CommunityRoot'
import { CommunityRootLoggingView } from '@/logging/CommunityRootLogging.view'
import { logger } from '@/logging/logger'
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

  protected addAccountToTransaction(foundedAccount: Account): void {
    const community = this.self.community
    if (this.keyCompare(foundedAccount.derive2Pubkey, this.communityRoot.aufPubkey)) {
      community.aufAccount = foundedAccount
      community.aufAccountId = foundedAccount.id
    } else if (this.keyCompare(foundedAccount.derive2Pubkey, this.communityRoot.gmwPubkey)) {
      community.gmwAccount = foundedAccount
      community.gmwAccountId = foundedAccount.id
    } else {
      throw new LogError("account don't belong to community")
    }
  }

  protected async createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account> {
    const community = this.self.community
    logger.debug('create missing account for communityRoot Transaction', {
      publicKey: Buffer.from(missingAccountPublicKey).toString('hex'),
      communityRoot: new CommunityRootLoggingView(this.communityRoot),
    })
    if (this.keyCompare(this.communityRoot.aufPubkey, missingAccountPublicKey)) {
      const aufAccount = AccountFactory.createAufAccount(
        new KeyPair(community),
        this.self.createdAt,
      )
      community.aufAccount = aufAccount
      return aufAccount
    } else if (this.keyCompare(this.communityRoot.gmwPubkey, missingAccountPublicKey)) {
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
