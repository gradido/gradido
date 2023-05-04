import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class FederatedCommunity {
  constructor(dbCom: DbFederatedCommunity) {
    this.id = dbCom.id
    this.foreign = dbCom.foreign
    this.publicKey = dbCom.publicKey.toString()
    this.url =
      (dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/') + dbCom.apiVersion
    this.lastAnnouncedAt = dbCom.lastAnnouncedAt
    this.verifiedAt = dbCom.verifiedAt
    this.lastErrorAt = dbCom.lastErrorAt
    this.createdAt = dbCom.createdAt
    this.updatedAt = dbCom.updatedAt
  }

  @Field(() => Int)
  id: number

  @Field(() => Boolean)
  foreign: boolean

  @Field(() => String)
  publicKey: string

  @Field(() => String)
  url: string

  @Field(() => Date, { nullable: true })
  lastAnnouncedAt: Date | null

  @Field(() => Date, { nullable: true })
  verifiedAt: Date | null

  @Field(() => Date, { nullable: true })
  lastErrorAt: Date | null

  @Field(() => Date, { nullable: true })
  createdAt: Date | null

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null
}
