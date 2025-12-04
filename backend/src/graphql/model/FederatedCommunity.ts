import { ensureUrlEndsWithSlash } from 'core'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class FederatedCommunity {
  constructor(dbCom: DbFederatedCommunity) {
    this.id = dbCom.id
    this.foreign = dbCom.foreign
    this.publicKey = dbCom.publicKey.toString('hex')
    this.apiVersion = dbCom.apiVersion
    this.endPoint = ensureUrlEndsWithSlash(dbCom.endPoint)
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
  apiVersion: string

  @Field(() => String)
  endPoint: string

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
