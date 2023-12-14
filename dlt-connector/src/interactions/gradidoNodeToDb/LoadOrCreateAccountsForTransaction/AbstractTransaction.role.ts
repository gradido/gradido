import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: Transaction) {}

  /**
   * check if accounts from this transaction already exist on transaction entity
   * @return true if acccount(s) already loaded, then this transaction can be skipped
   */
  public abstract alreadyLoaded(): boolean

  /**
   * return account public keys which a part of this transaction
   */
  public abstract getAccountPublicKeys(): Buffer[]

  /**
   * create missing account
   * @param missingAccountPublicKey
   * @return new created account, not yet saved
   */
  protected abstract createMissingAccount(missingAccountPublicKey: Buffer): Promise<Account>

  /**
   * check if transaction account is in map, if not create it and return it in account array
   * @param existingAccounts
   */
  public checkAndCreateMissingAccounts(existingAccounts: Map<Buffer, Account>): Promise<Account>[] {
    const localPublicKeys = this.getAccountPublicKeys()
    return localPublicKeys
      .filter((publicKey: Buffer) => !existingAccounts.has(publicKey))
      .map((publicKey: Buffer) => this.createMissingAccount(publicKey))
  }
}
