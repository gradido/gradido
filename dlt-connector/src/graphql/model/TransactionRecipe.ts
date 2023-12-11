import { Transaction } from '@entity/Transaction'
import { TransactionType } from '@enum/TransactionType'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class TransactionRecipe {
  public constructor({ id, createdAt, type, community }: Transaction) {
    this.id = id
    this.createdAt = createdAt.toString()
    this.type = type
    this.topic = community.iotaTopic
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
