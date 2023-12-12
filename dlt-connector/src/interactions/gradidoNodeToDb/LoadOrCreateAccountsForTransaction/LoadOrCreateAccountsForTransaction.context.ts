import { TransactionType } from '@/graphql/enum/TransactionType'

import { TransactionSet } from '../ConfirmTransactions.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'

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
    for (const transactionSet of this.transactionSets) {
      const transaction = transactionSet.confirmedTransactionRole.getTransaction()
      switch (transaction.type) {
        case TransactionType.COMMUNITY_ROOT:
          transactionSet.transactionRole = new CommunityRootTransactionRole(transaction)
          break
      }
    }
  }

  public async run(): Promise<void> {
    
  }
}