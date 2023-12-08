import { Transaction } from '@entity/Transaction'
import { TransactionType } from '@enum/TransactionType'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class TransactionRecipe {
  public constructor({ id, createdAt, type, senderCommunity }: Transaction) {
    this.id = id
    this.createdAt = createdAt.toString()
    this.type = type
    this.topic = senderCommunity.iotaTopic
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  createdAt: string

  @Field(() => TransactionType)
  type: TransactionType

  @Field(() => String)
  topic: string
}
