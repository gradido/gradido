import { Transaction } from '@entity/Transaction'
import { Field, Int, ObjectType } from 'type-graphql'

import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { LogError } from '@/server/LogError'
import { getEnumValue } from '@/utils/typeConverter'

@ObjectType()
export class TransactionRecipe {
  public constructor({ id, createdAt, type, community, signature }: Transaction) {
    const transactionType = getEnumValue(TransactionType, type)
    if (!transactionType) {
      throw new LogError('invalid transaction, type is missing')
    }
    this.id = id
    this.createdAt = createdAt.toString()
    this.type = transactionType.toString()
    this.topic = community.iotaTopic
    this.signatureHex = signature.toString('hex')
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  createdAt: string

  @Field(() => String)
  type: string

  @Field(() => String)
  topic: string

  @Field(() => String)
  signatureHex: string
}
