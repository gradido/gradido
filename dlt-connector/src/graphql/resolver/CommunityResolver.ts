import { Resolver, Query, Arg, Mutation, Args } from 'type-graphql'

import { CommunityDraft } from '@input/CommunityDraft'

import { createCommunity as createCommunityTransactionBody } from '@controller/TransactionBody'
import { getDataSource } from '@typeorm/DataSource'

import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionResult } from '@model/TransactionResult'
import { TransactionError } from '@model/TransactionError'
import { create as createCommunity, find, isExist } from '@/controller/Community'
import { TransactionErrorType } from '@enum/TransactionErrorType'
import { KeyManager } from '@/controller/KeyManager'
import { TransactionRecipe } from '@/controller/TransactionRecipe'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'
import { Community } from '@model/Community'
import { CommunityArg } from '@arg/CommunityArg'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/tasks/transmitToIota'

@Resolver()
export class CommunityResolver {
  @Query(() => Community)
  async community(@Args() communityArg: CommunityArg): Promise<Community> {
    logger.info('community', communityArg)
    const result = await find(communityArg)
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
    return (await find(communityArg)).length === 1
  }

  @Query(() => [Community])
  async communities(@Args() communityArg: CommunityArg): Promise<Community[]> {
    logger.info('communities', communityArg)
    const result = await find(communityArg)
    return result.map((communityEntity) => new Community(communityEntity))
  }

  @Mutation(() => TransactionResult)
  async addCommunity(
    @Arg('data')
    communityDraft: CommunityDraft,
  ): Promise<TransactionResult> {
    logger.info('addCommunity', communityDraft)
    try {
      const topic = iotaTopicFromCommunityUUID(communityDraft.uuid)
      // check if community was already written to db
      if (await isExist(topic)) {
        return new TransactionResult(
          new TransactionError(TransactionErrorType.ALREADY_EXIST, 'community already exist!'),
        )
      }
      const community = createCommunity(communityDraft, topic)

      // create only a CommunityRoot Start Transaction for own community
      if (!communityDraft.foreign) {
        const transaction = new GradidoTransaction(
          createCommunityTransactionBody(communityDraft, community),
        )
        KeyManager.getInstance().sign(transaction)
        const recipeController = await TransactionRecipe.create({ transaction })
        const recipe = recipeController.getTransactionRecipeEntity()
        recipe.senderCommunity = community

        const queryRunner = getDataSource().createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        let result: TransactionResult
        try {
          await queryRunner.manager.save(community)
          await queryRunner.manager.save(recipe)
          await queryRunner.commitTransaction()
          ConditionalSleepManager.getInstance().signal(TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY)
          result = new TransactionResult()
        } catch (err) {
          logger.error('error saving new community into db: %s', err)
          result = new TransactionResult(
            new TransactionError(TransactionErrorType.DB_ERROR, 'error saving community into db'),
          )
          await queryRunner.rollbackTransaction()
        } finally {
          await queryRunner.release()
        }

        return result
      } else {
        // foreign community are simply stored into db
        try {
          await community.save()
          return new TransactionResult()
        } catch (error) {
          logger.error('error saving new foreign community into db: %s', error)
          return new TransactionResult(
            new TransactionError(TransactionErrorType.DB_ERROR, 'error saving community into db'),
          )
        }
      }
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
