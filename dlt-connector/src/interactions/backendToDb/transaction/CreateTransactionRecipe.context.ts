import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipeRole'
import { BalanceChangingTransactionRecipeRole } from './BalanceChangingTransactionRecipeRole'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { ReceiveTransactionRole } from './ReceiveTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { SendTransactionRole } from './SendTransaction.role'

/**
 * @DCI-Context
 * Context for create and add Transaction Recipe to DB
 */

export interface AdditionalData {
  community?: Community
  account?: Account
}

export class CreateTransactionRecipeContext {
  private transactionRecipe: AbstractTransactionRecipeRole
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    private draft: CommunityDraft | TransactionDraft | UserAccountDraft,
    private data?: AdditionalData,
  ) {}

  public getTransactionRecipe(): Transaction {
    return this.transactionRecipe.getTransaction()
  }

  /**
   * @returns true if a transaction recipe was created and false if it wasn't necessary
   */
  public async run(): Promise<boolean> {
    if (this.draft instanceof TransactionDraft) {
      const transactionRecipeRole = new BalanceChangingTransactionRecipeRole()
      // contain logic for translation from backend to dlt-connector format
      let transactionTypeRole: AbstractTransactionRole
      switch (this.draft.type) {
        case InputTransactionType.CREATION:
          transactionTypeRole = new CreationTransactionRole(this.draft)
          break
        case InputTransactionType.SEND:
          transactionTypeRole = new SendTransactionRole(this.draft)
          break
        case InputTransactionType.RECEIVE:
          transactionTypeRole = new ReceiveTransactionRole(this.draft)
          break
      }
      await transactionRecipeRole.create(this.draft, transactionTypeRole)
      return true
    } else if (this.draft instanceof CommunityDraft) {
      if (!this.data?.community) {
        throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'community was not set')
      }
      this.transactionRecipe = new CommunityRootTransactionRole().create(
        this.draft,
        this.data.community,
      )
      return true
    } else if (this.draft instanceof UserAccountDraft) {
      if (!this.data?.account) {
        throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'account was not set')
      }
      if (!this.data.community) {
        throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'community was not set')
      }
      this.transactionRecipe = await new RegisterAddressTransactionRole().create(
        this.draft,
        this.data.account,
        this.data.community,
      )
      return true
    }
    return false
  }
}
