/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Community as DbCommunity } from '@entity/Community'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class FdCommunity {
  constructor(dbCommunity: DbCommunity) {
    this.apiVersion = dbCommunity.apiVersion
    this.createdAt = dbCommunity.createdAt
    this.id = dbCommunity.id
    this.lastAnnouncedAt = dbCommunity.lastAnnouncedAt
    this.publicKey = dbCommunity.publicKey.toString('hex')
    this.updatedAt = dbCommunity.updatedAt ? dbCommunity.updatedAt : null
    this.url = dbCommunity.endPoint
  }

  @Field(() => Number, { nullable: true })
  id: number

  @Field(() => String)
  publicKey: string

  @Field(() => String)
  apiVersion: string

  @Field(() => String)
  url: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  lastAnnouncedAt: Date | null

  @Field(() => Date, { nullable: true })
  verifiedAt: Date | null

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null
}
