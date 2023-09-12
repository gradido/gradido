import { Resolver, Query, Arg, Mutation } from 'type-graphql'

import { CommunityDraft } from '@input/CommunityDraft'

import { createCommunity as createCommunityTransactionBody } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'
import { DataSource } from '@typeorm/DataSource'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'
import {
  create as createCommunity,
  iotaTopicFromCommunityUUID,
  isExist,
} from '@/controller/Community'
import { TransactionErrorType } from '../enum/TransactionErrorType'
import { logger } from '@test/testSetup'

@Resolver()
export class CommunityResolver {
  // Why a dummy function?
  // to prevent this error by start:
  //   GeneratingSchemaError: Some errors occurred while generating GraphQL schema:
  //     Type Query must define one or more fields.
  // it seems that at least one query must be defined
  // https://github.com/ardatan/graphql-tools/issues/764
  @Query(() => String)
  version(): string {
    return '0.1'
  }

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

      // create only a CommunityRoot Start Transaction for own community
      if (!communityDraft.foreign) {
        const transaction = createGradidoTransaction(
          createCommunityTransactionBody(communityDraft, community),
        )
      }

      const queryRunner = DataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()
      let result: TransactionResult
      try {
        await queryRunner.manager.save(community)
        await queryRunner.commitTransaction()
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
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
