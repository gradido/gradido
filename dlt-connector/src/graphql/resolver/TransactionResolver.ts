import { Resolver, Query, Arg, Mutation } from 'type-graphql'

import { TransactionInput } from '@input/TransactionInput'
import { TransactionBody } from '@proto/TransactionBody'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'

import { TransmitTransactionResult } from '../model/TransmitTransactionResult'

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

  @Mutation(() => TransmitTransactionResult)
  async transmitTransaction(
    @Arg('data')
    transaction: TransactionInput,
  ): Promise<TransmitTransactionResult> {
    const message = TransactionBody.fromObject(transaction)
    const messageBuffer = TransactionBody.encode(message).finish()
    const resultMessage = await iotaSendMessage(messageBuffer)

    return new TransmitTransactionResult(resultMessage)
  }
}
