/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class FdCommunity {
  // using NOT the entity DbCommunity, because of necessary RAW-Sql to find the correct announced communities
  constructor(dbCommunity: any) {
    this.apiVersion = dbCommunity.api_version
    this.createdAt = dbCommunity.created_at
    this.id = dbCommunity.id
    this.lastAnnouncedAt = dbCommunity.last_announced_at
    this.publicKey = dbCommunity.public_key.toString('hex')
    this.updatedAt = dbCommunity.updated_at
    this.url = dbCommunity.end_point
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
