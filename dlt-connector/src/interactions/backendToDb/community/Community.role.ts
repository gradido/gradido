import { Community } from '@entity/Community'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'

export abstract class CommunityRole {
  protected self: Community
  public constructor() {
    this.self = Community.create()
  }

  public async create(communityDraft: CommunityDraft, topic: string): Promise<void> {
    this.self.iotaTopic = topic
    this.self.createdAt = new Date(communityDraft.createdAt)
    this.self.foreign = communityDraft.foreign
  }

  public store(): Promise<Community> {
    try {
      return this.self.save()
    } catch (error) {
      logger.error('error saving new community into db: %s', error)
      throw new TransactionError(TransactionErrorType.DB_ERROR, 'error saving community into db')
    }
  }
}