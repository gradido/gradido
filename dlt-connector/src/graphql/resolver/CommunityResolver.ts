import { CommunityArg } from '@arg/CommunityArg'
import { TransactionErrorType } from '@enum/TransactionErrorType'
import { CommunityDraft } from '@input/CommunityDraft'
import { Community } from '@model/Community'
import { TransactionError } from '@model/TransactionError'
import { TransactionResult } from '@model/TransactionResult'
import { Resolver, Query, Arg, Mutation, Args } from 'type-graphql'

import { CommunityRepository } from '@/data/Community.repository'
import { AddCommunityContext } from '@/interactions/backendToDb/community/AddCommunity.context'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

@Resolver()
export class CommunityResolver {
  @Query(() => Community)
  async community(@Args() communityArg: CommunityArg): Promise<Community> {
    logger.info('community', communityArg)
    const result = await CommunityRepository.findByCommunityArg(communityArg)
    if (result.length === 0) {
      throw new LogError('cannot find community')
    } else if (result.length === 1) {
      return new Community(result[0])
    } else {
      throw new LogError('find multiple communities')
    }
  }

  @Query(() => Boolean)
  async isCommunityExist(@Args() communityArg: CommunityArg): Promise<boolean> {
    logger.info('isCommunity', communityArg)
    return (await CommunityRepository.findByCommunityArg(communityArg)).length === 1
  }

  @Query(() => [Community])
  async communities(@Args() communityArg: CommunityArg): Promise<Community[]> {
    logger.info('communities', communityArg)
    const result = await CommunityRepository.findByCommunityArg(communityArg)
    return result.map((communityEntity) => new Community(communityEntity))
  }

  @Mutation(() => TransactionResult)
  async addCommunity(
    @Arg('data')
    communityDraft: CommunityDraft,
  ): Promise<TransactionResult> {
    logger.info('addCommunity', communityDraft)
    const topic = iotaTopicFromCommunityUUID(communityDraft.uuid)
    // check if community was already written to db
    if (await CommunityRepository.isExist(topic)) {
      return new TransactionResult(
        new TransactionError(TransactionErrorType.ALREADY_EXIST, 'community already exist!'),
      )
    }
    // prepare context for interaction
    // shouldn't throw at all
    // TODO: write tests to make sure that it doesn't throw
    const addCommunityContext = new AddCommunityContext(communityDraft, topic)
    try {
      // actually run interaction, create community, accounts for foreign community and transactionRecipe
      await addCommunityContext.run()
      return new TransactionResult()
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
