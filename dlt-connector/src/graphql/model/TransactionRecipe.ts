import { Field, Int, ObjectType } from 'type-graphql'
import { TransactionRecipe as TransactionRecipeEntity } from '@entity/TransactionRecipe'
import { TransactionType } from '@enum/TransactionType'

@ObjectType()
export class TransactionRecipe {
  public constructor({ id, createdAt, type, senderCommunity }: TransactionRecipeEntity) {
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
