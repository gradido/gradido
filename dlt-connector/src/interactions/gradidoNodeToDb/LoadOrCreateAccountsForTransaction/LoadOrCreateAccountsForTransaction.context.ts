import { Account } from '@entity/Account'

import { AccountRepository } from '@/data/Account.repository'
import { LogError } from '@/server/LogError'

import { TransactionSet } from '../ConfirmTransactions.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { DeferredTransferTransactionRole } from './DeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { TransferTransactionRole } from './TransferTransaction.role'

export interface ExtendedTransactionSet {
  transactionSet: TransactionSet
  transactionRole: AbstractTransactionRole
}

/**
 * Load correct Accounts for Transaction
 * Create Account and/or User for it if not in db
 */
export class LoadOrCreateAccountsForTransactionContext {
  private extendedTransactionSets: ExtendedTransactionSet[] = []

  // eslint-disable-next-line no-useless-constructor
  public constructor(transactionSets: TransactionSet[]) {
    // load correct roles for all transactions
    for (const transactionSet of transactionSets) {
      const transaction = transactionSet.confirmedTransactionRole.getTransaction()
      const transactionBody = transactionSet.protoConfirmedTransaction.getTransactionBody()
      let transactionRole: AbstractTransactionRole

      if (transactionBody.communityRoot) {
        transactionRole = new CommunityRootTransactionRole(
          transaction,
          transactionBody.communityRoot,
        )
      } else if (transactionBody.registerAddress) {
        transactionRole = new RegisterAddressTransactionRole(
          transaction,
          transactionBody.registerAddress,
        )
      } else if (transactionBody.transfer) {
        transactionRole = new TransferTransactionRole(transaction, transactionBody.transfer)
      } else if (transactionBody.creation) {
        transactionRole = new CreationTransactionRole(
          transaction,
          transactionSet.protoConfirmedTransaction.transaction,
        )
      } else if (transactionBody.deferredTransfer) {
        transactionRole = new DeferredTransferTransactionRole(
          transaction,
          transactionBody.deferredTransfer,
        )
      } else {
        throw new LogError('unhandled transaction type')
      }
      this.extendedTransactionSets.push({ transactionSet, transactionRole })
    }
  }

  /**
   *
   * @returns new created accounts
   */
  public async run(): Promise<Account[]> {
    // map for fast accessing loaded accounts
    // key is account public key
    const accountPublicKeys: Map<string, Account> = new Map()

    // load all existing accounts from db
    const accounts = await AccountRepository.findByPublicKeys(
      // convert to buffer, because coming from protobuf it is a Uint8Array
      this.collectAllAccountPublicKeys().map((value: Buffer) => Buffer.from(value)),
    )
    // fill into map
    accounts.forEach((account: Account) => {
      accountPublicKeys.set(Buffer.from(account.derive2Pubkey).toString('hex'), account)
    })

    const newAccounts: Account[] = []
    // create missing accounts
    for (const extendedTransactionSet of this.extendedTransactionSets) {
      if (!extendedTransactionSet.transactionRole.alreadyLoaded()) {
        const accounts = await extendedTransactionSet.transactionRole.checkAndCreateMissingAccounts(
          accountPublicKeys,
        )
        accounts.forEach((newAccount: Account) => {
          accountPublicKeys.set(Buffer.from(newAccount.derive2Pubkey).toString('hex'), newAccount)
          newAccounts.push(newAccount)
        })
      }
    }
    return newAccounts
  }

  /**
   * collect all account public keys from all transactions where accounts not already loaded
   * use set to make sure every entry exist only once
   * @returns unique buffer array, each Buffer containing a account public key
   */
  private collectAllAccountPublicKeys(): Buffer[] {
    return Array.from(
      new Set(
        this.extendedTransactionSets.flatMap((value: ExtendedTransactionSet) => {
          if (!value.transactionRole.alreadyLoaded()) {
            return value.transactionRole.getAccountPublicKeys()
          }
          return []
        }),
      ),
    )
  }
}
