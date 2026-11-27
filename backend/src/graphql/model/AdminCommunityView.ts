import { CommunitiesSelect } from 'database'
import { Field, ObjectType } from 'type-graphql'
import { Point } from 'typeorm'

import { Point2Location } from '@/graphql/resolver/util/Location2Point'

import { Location } from './Location'

@ObjectType()
export class AdminCommunityView {
  constructor(dbCom: CommunitiesSelect) {
    this.foreign = dbCom.foreign
    this.name = dbCom.name
    this.description = dbCom.description
    this.gmsApiKey = dbCom.gmsApiKey
    this.url = dbCom.url
    this.publicKey = dbCom.publicKey.toString('hex')
    this.creationDate = dbCom.creationDate
    this.createdAt = dbCom.createdAt
    this.updatedAt = dbCom.updatedAt
    this.uuid = dbCom.communityUuid
    this.authenticatedAt = dbCom.authenticatedAt
    this.verifiedAt = dbCom.verifiedAt
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

  // the last time a foreign community answered its community infos correctly
  @Field(() => Date, { nullable: true })
  verifiedAt: Date | null

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
}
