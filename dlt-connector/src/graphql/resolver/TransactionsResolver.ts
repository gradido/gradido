import { Resolver, Query, Arg, Mutation } from 'type-graphql'

import { TransactionInput } from '@input/TransactionInput'
import { TransactionBody } from '@proto/TransactionBody'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'

@Resolver()
export class TransactionResolver {
  // Why a dummy function?
  // to prevent this error by start:
  //   GeneratingSchemaError: Some errors occurred while generating GraphQL schema:
  //     Type Query must define one or more fields.
  // it seems that at least one query must be defined
  @Query(() => String)
  dummy(): string {
    return 'nothing'
  }

  @Mutation(() => String)
  async sendTransaction(
    @Arg('data')
    transaction: TransactionInput,
  ): Promise<string> {
    const message = TransactionBody.fromObject(transaction)
    const messageBuffer = TransactionBody.encode(message).finish()
    const resultMessage = iotaSendMessage(messageBuffer)
    return (await resultMessage).messageId
  }
}
