import { GradidoTransaction, MemoryBlock, transactionTypeToString } from 'gradido-blockchain-js'
import { Field, ObjectType } from 'type-graphql'

import { LogError } from '@/server/LogError'

@ObjectType()
export class TransactionRecipe {
  public constructor(transaction: GradidoTransaction, messageId: MemoryBlock) {
    const body = transaction.getTransactionBody()
    if (!body) {
      throw new LogError('invalid gradido transaction, cannot geht valid TransactionBody')
    }

    this.createdAt = body.getCreatedAt().getDate().toString()
    this.type = transactionTypeToString(body?.getTransactionType())
    this.messageIdHex = messageId.convertToHex()
  }

  @Field(() => String)
  createdAt: string

  @Field(() => String)
  type: string

  @Field(() => String)
  messageIdHex: string
}
