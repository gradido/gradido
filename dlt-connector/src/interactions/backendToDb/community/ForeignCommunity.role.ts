import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { CommunityRole } from './Community.role'
import { logger } from '@/server/logger'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { createCommunity } from '@/data/community.factory'

export class ForeignCommunityRole extends CommunityRole {
  addCommunity(communityDraft: CommunityDraft, topic: string): Promise<Community> {
    const community = createCommunity(communityDraft, topic)
    try {
      return community.save()
    } catch (error) {
      logger.error('error saving new foreign community into db: %s', error)
      throw new TransactionError(TransactionErrorType.DB_ERROR, 'error saving community into db')
    }
  }
}
