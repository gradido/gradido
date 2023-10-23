import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { TransactionRecipeRole } from './TransactionRecipe.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'

export const createCommunityRootTransactionRecipe = (
  communityDraft: CommunityDraft,
  community: Community,
): TransactionRecipeRole => {
  const communityRootTransactionRole = new CommunityRootTransactionRole()
  return communityRootTransactionRole.createFromCommunityDraft(communityDraft, community)
}

export const createTransactionRecipe = (
  transactionDraft: TransactionDraft,
): TransactionRecipeRole => {
  const transactionRecipeRole = new TransactionRecipeRole()
  return transactionRecipeRole.createFromTransactionDraft(transactionDraft)
}
