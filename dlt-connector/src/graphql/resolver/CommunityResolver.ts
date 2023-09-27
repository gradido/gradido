import { Resolver, Arg, Mutation } from 'type-graphql'

import { CommunityDraft } from '@input/CommunityDraft'

import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'
import { create as createCommunity, isExist } from '@/controller/Community'
import { TransactionErrorType } from '../enum/TransactionErrorType'
import { logger } from '@/server/logger'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

@Resolver()
export class CommunityResolver {
  @Mutation(() => TransactionResult)
  async addCommunity(
    @Arg('data')
    communityDraft: CommunityDraft,
  ): Promise<TransactionResult> {
    try {
      const topic = iotaTopicFromCommunityUUID(communityDraft.uuid)

      // check if community was already written to db
      if (await isExist(topic)) {
        return new TransactionResult(
          new TransactionError(TransactionErrorType.ALREADY_EXIST, 'community already exist!'),
        )
      }
      const community = createCommunity(communityDraft, topic)

      let result: TransactionResult

      if (!communityDraft.foreign) {
        // TODO: CommunityRoot Transaction for blockchain
      }
      try {
        await community.save()
        result = new TransactionResult()
      } catch (err) {
        logger.error('error saving new community into db: %s', err)
        result = new TransactionResult(
          new TransactionError(TransactionErrorType.DB_ERROR, 'error saving community into db'),
        )
      }
      return result
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
