import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { TransactionRecipeRole } from './TransactionRecipe.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'

export const createCommunityRootTransactionRecipe = (
  communityDraft: CommunityDraft,
  community: Community,
): TransactionRecipeRole => {
  const communityRootTransactionRole = new CommunityRootTransactionRole()
  return communityRootTransactionRole.create(communityDraft, community)
}
