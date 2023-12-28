import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { TransactionRecipeRole } from './TransactionRecipe.role'

/**
 * @DCI-Context
 * Context for create and add Transaction Recipe to DB
 */

export class CreateTransactionRecipeContext {
  private transactionRecipeRole: TransactionRecipeRole
  private community?: Community
  public constructor(private draft: CommunityDraft | TransactionDraft) {
    if (draft instanceof CommunityDraft) {
      this.transactionRecipeRole = new CommunityRootTransactionRole()
    } else if (draft instanceof TransactionDraft) {
      this.transactionRecipeRole = new TransactionRecipeRole()
    }
  }

  public setCommunity(community: Community) {
    this.community = community
  }

  public getCommunity(): Community | undefined {
    return this.community
  }

  public getTransactionRecipe(): Transaction {
    return this.transactionRecipeRole.getTransaction()
  }

  /**
   * @returns true if a transaction recipe was created and false if it wasn't necessary
   */
  public async run(): Promise<boolean> {
    if (this.draft instanceof TransactionDraft) {
      this.transactionRecipeRole = new TransactionRecipeRole()
      await this.transactionRecipeRole.create(this.draft)
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
