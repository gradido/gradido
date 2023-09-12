import { Resolver, Query, Arg, Mutation } from 'type-graphql'

import { CommunityDraft } from '@input/CommunityDraft'

import { createCommunity } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'
import { iotaTopicFromCommunityUUID, isExist } from '@/controller/Community'
import { TransactionErrorType } from '../enum/TransactionErrorType'

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
    community: CommunityDraft,
  ): Promise<TransactionResult> {
    try {
      const topic = iotaTopicFromCommunityUUID(community.uuid)
      // check if community was already written to db
      if (await isExist(topic)) {
        return new TransactionResult(
          new TransactionError(TransactionErrorType.ALREADY_EXIST, 'community already exist!'),
        )
      }
      // our own community
      if (!community.foreign) {
        const body = createCommunity(community)
      } else {

      }
      
      const body = createTransactionBody(community)
      const message = createGradidoTransaction(body)
      const messageBuffer = GradidoTransaction.encode(message).finish()
      const resultMessage = await iotaSendMessage(messageBuffer)
      return new TransactionResult(resultMessage.messageId)
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
