import { Account } from '@entity/Account'

import { AccountRepository } from '@/data/Account.repository'

import { TransactionSet } from '../ConfirmTransactions.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { DeferredTransferTransactionRole } from './DeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { TransferTransactionRole } from './TransferTransaction.role'

export interface ExtendedTransactionSet extends TransactionSet {
  transactionRole: AbstractTransactionRole
}

/**
 * Load correct Accounts for Transaction
 * Create Account and/or User for it if not in db
 */
export class LoadOrCreateAccountsForTransactionContext {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private transactionSets: ExtendedTransactionSet[]) {
    // load correct roles for all transactions
    for (const transactionSet of this.transactionSets) {
      const transaction = transactionSet.confirmedTransactionRole.getTransaction()
      const transactionBody = transactionSet.protoConfirmedTransaction.getTransactionBody()

      if (transactionBody.communityRoot) {
        transactionSet.transactionRole = new CommunityRootTransactionRole(
          transaction,
          transactionBody.communityRoot,
        )
      } else if (transactionBody.registerAddress) {
        transactionSet.transactionRole = new RegisterAddressTransactionRole(
          transaction,
          transactionBody.registerAddress,
        )
      } else if (transactionBody.transfer) {
        transactionSet.transactionRole = new TransferTransactionRole(
          transaction,
          transactionBody.transfer,
        )
      } else if (transactionBody.creation) {
        transactionSet.transactionRole = new CreationTransactionRole(
          transaction,
          transactionBody.creation,
        )
      } else if (transactionBody.deferredTransfer) {
        transactionSet.transactionRole = new DeferredTransferTransactionRole(
          transaction,
          transactionBody.deferredTransfer,
        )
      }
    }
  }

  public async run(): Promise<void> {
    // map for fast accessing loaded accounts
    // key is account public key
    const accountPublicKeys: Map<string, Account> = new Map()

    // load all existing accounts from db
    const accounts = await AccountRepository.findByPublicKeys(this.collectAllAccountPublicKeys())
    // fill into map
    accounts.forEach((account: Account) => {
      accountPublicKeys.set(account.derive2Pubkey.toString('hex'), account)
    })
    let newAccountPromises: Promise<Account>[] = []
    // create missing accounts
    this.transactionSets.forEach(async (transactionSet) => {
      if (!transactionSet.transactionRole.alreadyLoaded()) {
        newAccountPromises = newAccountPromises.concat(
          transactionSet.transactionRole.checkAndCreateMissingAccounts(accountPublicKeys),
        )
      }
    })
    await Account.save(await Promise.all(newAccountPromises))
  }

  /**
   * collect all account public keys from all transactions where accounts not already loaded
   * use set to make sure every entry exist only once
   * @returns unique buffer array, each Buffer containing a account public key
   */
  private collectAllAccountPublicKeys(): Buffer[] {
    return Array.from(
      new Set(
        this.transactionSets.flatMap((value: ExtendedTransactionSet) => {
          if (!value.transactionRole.alreadyLoaded()) {
            return value.transactionRole.getAccountPublicKeys()
          }
          return []
        }),
      ),
    )
  }
}
