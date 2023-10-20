import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { KeyManager } from './KeyManager'
import { KeyPair } from '@/model/KeyPair'
import { iotaTopicFromCommunityUUID, timestampSecondsToDate } from '@/utils/typeConverter'
import { createCommunity as createCommunityTransactionBody } from '@controller/TransactionBody'
import { getDataSource } from '@/typeorm/DataSource'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { TransactionRecipe } from '@model/TransactionRecipe'
import { TransactionResult } from '@/graphql/model/TransactionResult'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { getTransaction } from '@/client/GradidoNode'
import { confirmFromNodeServer } from './ConfirmedTransaction'
import {
  TransactionRecipe as TransactionRecipeController,
  findBySignature,
} from '@/controller/TransactionRecipe'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/tasks/transmitToIota'
import { createHomeCommunity } from '@/data/community.factory'

export const confirm = async (iotaTopic: string, confirmedAt: Date): Promise<boolean> => {
  const query = `
    UPDATE communities c
    LEFT JOIN accounts gmw ON c.gmw_account_id = gmw.id
    LEFT JOIN accounts auf ON c.auf_account_id = auf.id
    SET c.confirmed_at = ?,
        gmw.confirmed_at = ?,
        auf.confirmed_at = ?
    WHERE c.iota_topic = ?
  `

  const entityManager = Community.getRepository().manager // getDataSource().manager
  const result = await entityManager.query(query, [
    confirmedAt,
    confirmedAt,
    confirmedAt,
    iotaTopic,
  ])

  if (result.affected && result.affected > 1) {
    throw new LogError('more than one community matched by topic: %s', iotaTopic)
  }
  return result.affected === 1
}

export const loadHomeCommunityKeyPair = async (): Promise<KeyPair> => {
  const community = await Community.findOneOrFail({
    where: { foreign: false },
    select: { rootChaincode: true, rootPubkey: true, rootPrivkey: true },
  })
  if (!community.rootChaincode || !community.rootPrivkey) {
    throw new Error('Missing chaincode or private key for home community')
  }
  return new KeyPair(community)
}

/**
 * should be only called if home community not already exist
 * @param communityDraft
 * @returns
 */
export const addHomeCommunity = async (
  communityDraft: CommunityDraft,
): Promise<TransactionResult> => {
  try {
    if (communityDraft.foreign) {
      throw new LogError('not a home community')
    }
    const topic = iotaTopicFromCommunityUUID(communityDraft.uuid)
    const community = createHomeCommunity(communityDraft, topic)

    // check if a CommunityRoot Transaction exist already on iota blockchain
    const existingCommunityRootTransaction = await getTransaction(1, community.iotaTopic)
    if (existingCommunityRootTransaction) {
      await confirmFromNodeServer([existingCommunityRootTransaction], topic)
      const firstSignaturePair = existingCommunityRootTransaction.transaction.getFirstSignature()
      const recipe = await findBySignature(firstSignaturePair.signature)
      if (!recipe) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "load community root entry from Gradido Node, but couldn't find it afterwards in DB",
        )
      }
      community.confirmedAt = timestampSecondsToDate(existingCommunityRootTransaction.confirmedAt)
      community.save()
      recipe.senderCommunity = community

      // console.log('result from resolver call: %o', recipe)
      return new TransactionResult(new TransactionRecipe(recipe))
    }

    const transaction = new GradidoTransaction(
      createCommunityTransactionBody(communityDraft, community),
    )
    KeyManager.getInstance().sign(transaction)
    const recipeController = await TransactionRecipeController.create({ transaction })
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
      result = new TransactionResult(new TransactionRecipe(recipe))
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
  } catch (error) {
    if (error instanceof TransactionError) {
      return new TransactionResult(error)
    } else {
      throw error
    }
  }
}
