import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: Transaction) {}

  /**
   * check if key1 and key2 has the same content
   * use Buffer.from because Buffer from Protobuf are Uint8Arrays
   * @param key1
   * @param key2
   */
  public keyCompare(key1: Buffer, key2: Buffer): boolean {
    return Buffer.from(key1).equals(Buffer.from(key2))
  }

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
   * set account at the right place on transaction object
   * @param foundedAccount
   */
  protected abstract addAccountToTransaction(foundedAccount: Account): void

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
  public async checkAndCreateMissingAccounts(
    existingAccounts: Map<string, Account>,
  ): Promise<Account[]> {
    const localPublicKeys = this.getAccountPublicKeys()
    const newAccounts: Account[] = []
    for (const localPublicKey of localPublicKeys) {
      let account = existingAccounts.get(Buffer.from(localPublicKey).toString('hex'))
      if (!account) {
        account = await this.createMissingAccount(localPublicKey)
        newAccounts.push(account)
      }
      this.addAccountToTransaction(account)
    }
    return newAccounts
  }
}
