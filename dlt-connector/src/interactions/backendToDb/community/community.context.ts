import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionResult } from '@/graphql/model/TransactionResult'
import { ForeignCommunityRole } from './ForeignCommunity.role'
import { HomeCommunityRole } from './HomeCommunity.role'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionsManager } from '@/controller/TransactionsManager'

export const addCommunity = async (
  communityDraft: CommunityDraft,
  iotaTopic: string,
): Promise<TransactionResult> => {
  const communityRole = communityDraft.foreign
    ? new ForeignCommunityRole()
    : new HomeCommunityRole()
  try {
    await communityRole.addCommunity(communityDraft, iotaTopic)
    await TransactionsManager.getInstance().addTopic(iotaTopic)
    return new TransactionResult()
  } catch (error) {
    if (error instanceof TransactionError) {
      return new TransactionResult(error)
    } else {
      throw error
    }
  }
}
