import { Community as CommunityEntity } from '@entity/Community'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class Community {
  constructor(entity: CommunityEntity) {
    this.id = entity.id
    this.iotaTopic = entity.iotaTopic
    if (entity.rootPubkey) {
      this.rootPublicKeyHex = entity.rootPubkey?.toString('hex')
    }
    this.foreign = entity.foreign
    this.createdAt = entity.createdAt.toString()
    if (entity.confirmedAt) {
      this.confirmedAt = entity.confirmedAt.toString()
    }
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  iotaTopic: string

  @Field(() => String)
  rootPublicKeyHex?: string

  @Field(() => Boolean)
  foreign: boolean

  @Field(() => String)
  createdAt: string

  @Field(() => String)
  confirmedAt?: string
}
