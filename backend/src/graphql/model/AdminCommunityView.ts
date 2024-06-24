import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { ObjectType, Field } from 'type-graphql'

import { FederatedCommunity } from './FederatedCommunity'
import { Point } from './Point'

@ObjectType()
export class AdminCommunityView {
  constructor(dbCom: DbCommunity) {
    if (dbCom.federatedCommunities && dbCom.federatedCommunities.length > 0) {
      const federatedCommunity = dbCom.federatedCommunities[0]
      this.foreign = federatedCommunity.foreign
      const url = new URL(federatedCommunity.endPoint)
      // use only the host part
      this.url = url.protocol + '//' + url.host
      this.publicKey = federatedCommunity.publicKey.toString('hex')
      this.federatedCommunities = dbCom.federatedCommunities.map(
        (federatedCom: DbFederatedCommunity) => new FederatedCommunity(federatedCom),
      )
    }
    if (dbCom.foreign !== undefined) {
      this.foreign = dbCom.foreign
    }
    this.name = dbCom.name
    this.description = dbCom.description
    this.gmsApiKey = dbCom.gmsApiKey
    if (dbCom.url) {
      this.url = dbCom.url
    }
    if (dbCom.publicKey && dbCom.publicKey.length === 32) {
      this.publicKey = dbCom.publicKey.toString('hex')
    }
    this.creationDate = dbCom.creationDate
    this.createdAt = dbCom.createdAt
    this.updatedAt = dbCom.updatedAt
    this.uuid = dbCom.communityUuid
    this.authenticatedAt = dbCom.authenticatedAt
    this.gmsApiKey = dbCom.gmsApiKey
    this.location = dbCom.location
  }

  @Field(() => Boolean)
  foreign: boolean

  @Field(() => String)
  url: string

  @Field(() => String)
  publicKey: string

  @Field(() => String, { nullable: true })
  uuid: string | null

  @Field(() => Date, { nullable: true })
  authenticatedAt: Date | null

  @Field(() => String, { nullable: true })
  name: string | null

  @Field(() => String, { nullable: true })
  description: string | null

  @Field(() => String, { nullable: true })
  gmsApiKey: string | null

  @Field(() => Point, { nullable: true })
  location: Point | null

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => Date, { nullable: true })
  createdAt: Date | null

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  @Field(() => [FederatedCommunity], { nullable: true })
  federatedCommunities: FederatedCommunity[] | null
}
