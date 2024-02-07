import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { ReceiveTransactionRole } from './ReceiveTransaction.role'
import { SendTransactionRole } from './SendTransaction.role'
import { TransactionRecipeRole } from './TransactionRecipe.role'

/**
 * @DCI-Context
 * Context for create and add Transaction Recipe to DB
 */

export class CreateTransactionRecipeContext {
  private transactionRecipeRole: TransactionRecipeRole
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    private draft: CommunityDraft | TransactionDraft,
    private community?: Community,
  ) {}

  public getTransactionRecipe(): Transaction {
    return this.transactionRecipeRole.getTransaction()
  }

  /**
   * @returns true if a transaction recipe was created and false if it wasn't necessary
   */
  public async run(): Promise<boolean> {
    if (this.draft instanceof TransactionDraft) {
      this.transactionRecipeRole = new TransactionRecipeRole()
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
      await this.transactionRecipeRole.create(this.draft, transactionTypeRole)
      return true
    } else if (this.draft instanceof CommunityDraft) {
      if (!this.community) {
        throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'community was not set')
      }
      this.transactionRecipeRole = new CommunityRootTransactionRole().createFromCommunityRoot(
        this.draft,
        this.community,
      )
      return true
    }
    return false
  }
}
