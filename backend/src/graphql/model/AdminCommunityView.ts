import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'
import { Field, ObjectType } from 'type-graphql'
import { Point } from 'typeorm'

import { Point2Location } from '@/graphql/resolver/util/Location2Point'

import { FederatedCommunity } from './FederatedCommunity'
import { Location } from './Location'

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
    this.hieroTopicId = dbCom.hieroTopicId
    if (dbCom.location) {
      this.location = Point2Location(dbCom.location as Point)
    }
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

  @Field(() => Location, { nullable: true })
  location: Location | null

  @Field(() => String, { nullable: true })
  hieroTopicId: string | null

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => Date, { nullable: true })
  createdAt: Date | null

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  @Field(() => [FederatedCommunity], { nullable: true })
  federatedCommunities: FederatedCommunity[] | null
}
