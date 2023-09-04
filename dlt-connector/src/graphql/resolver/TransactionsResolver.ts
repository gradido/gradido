import { Resolver, Query, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { create as createTransactionBody } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'

@Resolver()
export class TransactionResolver {
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

  @Mutation(() => String)
  async sendTransaction(
    @Arg('data')
    transaction: TransactionDraft,
  ): Promise<TransactionResult> {
    try {
      const body = createTransactionBody(transaction)
      const message = createGradidoTransaction(body)
      const messageBuffer = GradidoTransaction.encode(message).finish()
      const resultMessage = await iotaSendMessage(messageBuffer)
      return new TransactionResult(resultMessage.messageId)
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      }
      throw error
    }
  }
}
